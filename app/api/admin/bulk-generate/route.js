export const dynamic = 'force-dynamic';

import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';
import { sanitiseSlug, getPrompt, buildTitleHint, callOpenRouter, enforceArticleMeta, candidateSlugs } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Paginate through ALL articles (PostgREST caps single responses at 1000 rows
// regardless of `.limit()`, so we MUST use `.range()` in batches to fetch
// every row). Without this, topics whose articles live past row 1000 silently
// pass the "already has an article" filter and waste an AI call before the
// DB unique constraint rejects them.
async function fetchAllArticlesForBulk(supabase) {
  const batchSize = 1000;
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, topic_id, language, status, topics(category)')
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function generateArticle(topic, _categoryFallback, existingSlugs, existingTitles) {
  // Always use the topic's own category from the DB — never trust the caller's fallback
  const category      = topic.category || _categoryFallback || 'questions';
  const contentPrompt = getPrompt(category, topic.name.trim(), '');
  const titleHint     = buildTitleHint(category, topic.name.trim());

  const prompt = `EXISTING ARTICLES — do NOT write a duplicate of any of these:
${existingTitles || '  (none yet)'}

${contentPrompt}${titleHint}

Return ONLY this JSON object (no markdown, no code fences, no commentary outside the JSON):
{
  "title":            "Specific, compelling article title — not generic",
  "slug":             "url-friendly-slug-with-hyphens",
  "meta_title":       "SEO title under 60 chars",
  "meta_description": "140-155 char meta description that makes someone want to click",
  "keywords":         ["3-5 keyword strings"],
  "content":          "<p>Full article HTML. Allowed tags: p, h2, h3, ul, ol, li, strong, blockquote. Format quoted Bible verses as <blockquote> tags: <blockquote>\\"Verse text\\" (Book Chapter:Verse)</blockquote>. Cite unquoted verse references inline as BookName Chapter:Verse. Do NOT use h1. Do NOT use markdown.</p>"
}

HARD RULES:
- Doctrinal stance: evangelical, biblically faithful
- Slug: lowercase letters and hyphens only, no underscores, no numbers unless essential
- content field: valid HTML string, all double-quotes inside escaped as \\"
- Return ONLY the JSON — nothing before or after it`;

  const MESSAGES = [
    {
      role: 'system',
      content: `You are a senior Christian content writer with 15 years of experience writing for major Bible study publications. Your writing is known for being human, direct, and grounded in Scripture without being preachy. You write for real people dealing with real struggles — not for bots or algorithms. You always respond with valid JSON only, exactly as specified.`,
    },
    { role: 'user', content: prompt },
  ];

  // Attempt once, retry once on any failure (truncation, parse error, transient network)
  let raw;
  let generated;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      raw       = await callOpenRouter(MESSAGES);
      generated = JSON.parse(raw);
      break; // success
    } catch (err) {
      if (attempt === 2) throw err; // re-throw on second failure
      // Brief pause before retry to avoid hammering the API
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Enforce deterministic title/slug for strict-format categories
  const enforced   = enforceArticleMeta(category, topic.name.trim());
  const finalTitle = enforced?.title ?? generated.title ?? topic.name;
  const rawSlug    = enforced?.slug  ?? sanitiseSlug(generated.slug || generated.title || topic.name);
  const slug       = sanitiseSlug(rawSlug);
  if (!slug) throw new Error('Could not generate a valid slug');

  return {
    title:            finalTitle,
    slug,
    meta_title:       generated.meta_title || generated.title || null,
    meta_description: generated.meta_description || null,
    keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
    content:          generated.content || '',
    topic_id:         topic.id,
    status:           'draft',
  };
}

export async function POST(request) {
  const body = await request.json();

  const topicIds   = Array.isArray(body.topicIds) ? body.topicIds : [];
  const category   = body.category || 'questions';
  const safeLimit  = Math.min(Math.max(parseInt(body.limit ?? body.count ?? 20, 10) || 20, 1), 50);
  const saveStatus = body.saveAsDraft === true ? 'draft' : 'published';
  const language   = (body.language || 'en').toString().toLowerCase().trim();
  // When true, topics whose existing article is NOT published (draft/rejected)
  // are eligible for regeneration — the old draft is deleted right before the
  // new article is inserted. PUBLISHED articles are NEVER touched regardless.
  const replaceDrafts = body.replaceDrafts === true;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data) {
        controller.enqueue(encoder.encode(sseEvent(data)));
      }

      try {
        if (!supabase) {
          send({ type: 'error', message: 'Supabase is not configured.' });
          controller.close();
          return;
        }

        // Strict 1 topic = 1 article rule — fetch ALL articles regardless of status,
        // language, or category to build the topic-skip set and the global slug set.
        // Mirrors the DB-level UNIQUE (topic_id) constraint:
        //   ALTER TABLE articles ADD CONSTRAINT unique_topic_article UNIQUE (topic_id);
        // CRITICAL: must paginate — PostgREST caps single responses at 1000 rows.
        let allArticles;
        try {
          allArticles = await fetchAllArticlesForBulk(supabase);
        } catch (fetchErr) {
          send({ type: 'error', message: `Could not load existing articles: ${fetchErr.message}` });
          controller.close();
          return;
        }

        // Topics that ALREADY have a PUBLISHED article are off-limits — no generation
        // path can ever touch live content. Topics with only drafts/rejected articles
        // are skipped by default but become eligible when `replaceDrafts` is enabled.
        const publishedTopicIds = new Set(
          (allArticles || []).filter(a => a.status === 'published').map(a => a.topic_id).filter(Boolean)
        );
        const usedTopicIds = replaceDrafts
          ? publishedTopicIds // only PUBLISHED topics are blocked
          : new Set((allArticles || []).map(a => a.topic_id).filter(Boolean)); // any article blocks
        // Slug uniqueness is global across all languages (URLs must be unique)
        const existingSlugs = new Set((allArticles || []).map(a => a.slug));

        // Lookup maps so a skip event can include the conflicting article's location
        function existingFromRow(a) {
          return {
            id:       a.id,
            title:    a.title,
            slug:     a.slug,
            status:   a.status,
            language: a.language,
            category: a.topics?.category || null,
          };
        }
        const articleByTopicId = new Map(
          (allArticles || [])
            .filter(a => a.topic_id)
            .map(a => [a.topic_id, existingFromRow(a)])
        );
        const articleBySlug = new Map(
          (allArticles || []).map(a => [a.slug, existingFromRow(a)])
        );
        // Title uniqueness — keep scoped to PUBLISHED articles in THIS language only.
        // (Title collisions across languages are fine; draft titles can be edited.)
        const sameLangPublished = (allArticles || []).filter(
          a => a.status === 'published' && a.language === language
        );
        const allTitlesLower = new Set(
          sameLangPublished.map(a => (a.title || '').toLowerCase().trim())
        );
        const existingTitles = sameLangPublished.map(a => `  - ${a.title}`).join('\n');

        // Resolve the ordered list of topics to process
        let orderedTopics;

        if (topicIds.length > 0) {
          // Specific topic IDs provided (advanced mode)
          const { data: topicsData, error: topicsError } = await supabase
            .from('topics')
            .select('id, name, category')
            .in('id', topicIds);

          if (topicsError || !topicsData?.length) {
            send({ type: 'error', message: 'Could not load the selected topics from the database.' });
            controller.close();
            return;
          }

          orderedTopics = topicIds
            .map(id => topicsData.find(t => t.id === id))
            .filter(Boolean)
            .slice(0, safeLimit);
        } else {
          // Category-based auto-selection (simple mode)
          const { data: categoryTopics, error: catErr } = await supabase
            .from('topics')
            .select('id, name, category')
            .eq('category', category)
            .order('name')
            .limit(safeLimit * 5); // fetch extra so we can filter out already-created ones

          if (catErr || !categoryTopics?.length) {
            send({ type: 'error', message: `No topics found for category "${category}". Add topics first.` });
            controller.close();
            return;
          }

          // Only pick topics that don't already have ANY article (any status, any language)
          orderedTopics = categoryTopics
            .filter(t => !usedTopicIds.has(t.id))
            .slice(0, safeLimit);
        }

        if (!orderedTopics.length) {
          send({ type: 'error', message: `All topics in this category already have an article.` });
          controller.close();
          return;
        }

        // toProcess = same as orderedTopics (usedTopicIds already filtered above for auto mode;
        // for explicit topicIds mode we still apply the filter for safety)
        const toProcess  = orderedTopics.filter(t => !usedTopicIds.has(t.id));
        const preSkipped = orderedTopics.length - toProcess.length;

        const total = toProcess.length;

        if (!total) {
          send({ type: 'error', message: `All selected topics already have an article.` });
          controller.close();
          return;
        }

        send({ type: 'start', total, preSkipped });

        let generated = 0;
        let skipped   = preSkipped;

        for (let i = 0; i < toProcess.length; i++) {
          const topic = toProcess[i];
          send({ type: 'progress', current: i + 1, total, topic: topic.name });

          try {
            // EARLY SLUG PRE-CHECK — for predictable categories, skip BEFORE the
            // expensive OpenRouter call so we don't burn AI cost on a topic we
            // already know we'll have to reject.
            // EXCEPTION: when replaceDrafts is on and the colliding slug belongs
            // to a NON-PUBLISHED article on THIS SAME topic, don't skip — the
            // topic-level branch below will delete the draft and we can re-use
            // the same predictable slug.
            const topicCategory = topic.category || category || 'questions';
            const preCandidates = candidateSlugs(topicCategory, topic.name.trim());
            const preCollision = preCandidates.find(s => existingSlugs.has(s));
            if (preCollision) {
              const owner = articleBySlug.get(preCollision) || null;
              const isPublished = owner?.status === 'published';
              const ownedBySameTopic = owner?.id && articleByTopicId.get(topic.id)?.id === owner.id;
              const replaceableSelfDraft = replaceDrafts && !isPublished && ownedBySameTopic;
              if (!replaceableSelfDraft) {
                send({
                  type: 'skipped', current: i + 1, total, topic: topic.name,
                  code: isPublished ? 'PUBLISHED_SLUG_EXISTS' : 'SLUG_ALREADY_EXISTS',
                  reason: isPublished
                    ? `Slug "${preCollision}" is used by a PUBLISHED article — cannot recreate`
                    : `Slug "${preCollision}" already exists`,
                  existingArticle: owner,
                });
                skipped++;
                continue;
              }
              // Fall through — the existingForTopic branch will delete this
              // draft, freeing the slug for the regenerated article.
            }

            // REAL concurrency guard: re-query the DB right before the AI call.
            // The snapshot from run start could be stale if another admin
            // session inserted concurrently. One indexed lookup (~5ms) prevents
            // wasting a 15-25s AI call AND guarantees we never touch live content.
            const { data: liveCheck } = await supabase
              .from('articles')
              .select('id, title, slug, status, language, topics(category)')
              .eq('topic_id', topic.id)
              .limit(1);
            const existingForTopic = liveCheck?.[0]
              ? {
                  id:       liveCheck[0].id,
                  title:    liveCheck[0].title,
                  slug:     liveCheck[0].slug,
                  status:   liveCheck[0].status,
                  language: liveCheck[0].language,
                  category: liveCheck[0].topics?.category || null,
                }
              : (articleByTopicId.get(topic.id) || null);

            // Decision matrix:
            //   PUBLISHED    → ALWAYS skip (cannot touch live content)
            //   draft/rejected + replaceDrafts ON → delete old, then insert new
            //   draft/rejected + replaceDrafts OFF → skip (existing behavior)
            //   no existing article → proceed
            if (existingForTopic) {
              const isPublished = existingForTopic.status === 'published';
              // Refresh in-memory caches so later iterations see this row
              articleByTopicId.set(topic.id, existingForTopic);
              if (existingForTopic.slug) {
                articleBySlug.set(existingForTopic.slug, existingForTopic);
              }

              if (isPublished) {
                // Hard block — published content is never touched by generation
                existingSlugs.add(existingForTopic.slug);
                usedTopicIds.add(topic.id);
                send({
                  type: 'skipped', current: i + 1, total, topic: topic.name,
                  code: 'PUBLISHED_ARTICLE_EXISTS',
                  reason: `Published article already exists for this topic — cannot recreate`,
                  existingArticle: existingForTopic,
                });
                skipped++;
                continue;
              }

              if (!replaceDrafts) {
                // Existing draft/rejected — skip unless user opted into replacement
                existingSlugs.add(existingForTopic.slug);
                usedTopicIds.add(topic.id);
                send({
                  type: 'skipped', current: i + 1, total, topic: topic.name,
                  code: 'TOPIC_ALREADY_HAS_ARTICLE',
                  reason: `Topic already has an article (${existingForTopic.status}) — enable "Replace existing drafts" to regenerate`,
                  existingArticle: existingForTopic,
                });
                skipped++;
                continue;
              }

              // replaceDrafts ON + non-published existing article: free its
              // slug from the existingSlugs set so the regenerated article
              // can use the same one if appropriate, then delete the old row.
              if (existingForTopic.slug) existingSlugs.delete(existingForTopic.slug);
              usedTopicIds.delete(topic.id);
              // Belt-and-suspenders: only delete if NOT published (already
              // checked above, but explicit .neq() guarantees the SQL itself
              // can never touch a published row even if the snapshot lied).
              const { error: delErr } = await supabase
                .from('articles')
                .delete()
                .eq('id', existingForTopic.id)
                .neq('status', 'published');
              if (delErr) {
                send({
                  type: 'skipped', current: i + 1, total, topic: topic.name,
                  reason: `Couldn't replace existing draft: ${delErr.message}`,
                  existingArticle: existingForTopic,
                });
                skipped++;
                continue;
              }
              // Old draft removed — fall through to generate + insert
            }

            const article = await generateArticle(topic, category, existingSlugs, existingTitles);

            // Strict 1 topic = 1 article rule — never append "-2" / "-3" suffixes.
            // If the slug already exists, skip this topic entirely.
            if (existingSlugs.has(article.slug)) {
              const owner = articleBySlug.get(article.slug) || null;
              const isPublished = owner?.status === 'published';
              send({
                type: 'skipped', current: i + 1, total, topic: topic.name,
                code: isPublished ? 'PUBLISHED_SLUG_EXISTS' : 'SLUG_ALREADY_EXISTS',
                reason: isPublished
                  ? `Slug "${article.slug}" is used by a PUBLISHED article — cannot recreate`
                  : `Slug "${article.slug}" already exists`,
                existingArticle: owner,
              });
              skipped++;
              continue;
            }

            const titleLower = (article.title || '').toLowerCase().trim();
            const titleConflict = allTitlesLower.has(titleLower);
            if (titleConflict) {
              send({ type: 'skipped', current: i + 1, total, topic: topic.name, reason: `Identical title already published in "${language}"` });
              skipped++;
              continue;
            }

            existingSlugs.add(article.slug);

            const { html: enrichedHtml } = await enrichContent(article.content);
            article.content  = enrichedHtml;
            article.status   = saveStatus;
            article.language = language;

            const { error: insertError } = await supabase.from('articles').insert(article).select().single();

            if (insertError) {
              let reason = insertError.message;
              let existingArticle = null;
              let code = null;
              if (insertError.code === '23505') {
                // Distinguish topic-uniqueness vs slug-uniqueness collisions, and
                // distinguish PUBLISHED vs draft conflicts so the UI can surface
                // an explicit "cannot recreate live content" message.
                const constraint = (insertError.constraint || insertError.details || '').toString();
                const isTopicConflict = constraint.includes('unique_topic_article') || constraint.includes('topic_id');
                if (isTopicConflict) {
                  existingArticle = articleByTopicId.get(topic.id) || null;
                  const isPublished = existingArticle?.status === 'published';
                  code = isPublished ? 'PUBLISHED_ARTICLE_EXISTS' : 'TOPIC_ALREADY_HAS_ARTICLE';
                  reason = isPublished
                    ? 'Published article already exists for this topic — cannot recreate'
                    : 'Topic already has an article';
                } else {
                  existingArticle = articleBySlug.get(article.slug) || null;
                  const isPublished = existingArticle?.status === 'published';
                  code = isPublished ? 'PUBLISHED_SLUG_EXISTS' : 'SLUG_ALREADY_EXISTS';
                  reason = isPublished ? 'Slug used by a PUBLISHED article' : 'Duplicate slug';
                }
              }
              send({ type: 'skipped', current: i + 1, total, topic: topic.name, code, reason, existingArticle });
              skipped++;
            } else {
              // Track newly saved title/slug so the rest of this run won't duplicate them
              allTitlesLower.add(titleLower);
              send({ type: 'saved', current: i + 1, total, title: article.title, slug: article.slug, status: saveStatus });
              generated++;
            }
          } catch (err) {
            console.error(`[bulk-generate] topic "${topic.name}" failed:`, err.message);
            send({ type: 'skipped', current: i + 1, total, topic: topic.name, reason: err.message });
            skipped++;
          }
        }

        send({ type: 'done', generated, skipped });
      } catch (err) {
        console.error('[bulk-generate]', err);
        send({ type: 'error', message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
