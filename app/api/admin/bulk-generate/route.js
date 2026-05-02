export const dynamic = 'force-dynamic';

import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';
import { sanitiseSlug, getPrompt, buildTitleHint, callOpenRouter, enforceArticleMeta, candidateSlugs } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';
import { sanitizeForPg } from '../../../../lib/sanitizeForPg.js';

// THE ONE RULE:
//   PUBLISHED articles are sacred — never touched, never overwritten.
//   Anything else (draft / rejected) is auto-deleted before generation.

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Paginate through ALL articles — PostgREST caps single responses at 1000 rows.
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

// Defense-in-depth delete: only deletes if the row is NOT published.
async function deleteNonPublishedArticle(id) {
  if (!id) return null;
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .neq('status', 'published');
  return error || null;
}

async function generateArticle(topic, _categoryFallback, existingTitles) {
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
  "content":          "<p>Full article HTML. Allowed tags: p, h2, h3, ul, ol, li, strong, blockquote. Format quoted Bible verses as <blockquote>\\"Verse text\\" (Book Chapter:Verse)</blockquote>. Cite unquoted verse references inline as BookName Chapter:Verse. Do NOT use h1. Do NOT use markdown.</p>"
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

  let raw;
  let generated;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      raw       = await callOpenRouter(MESSAGES);
      generated = JSON.parse(raw);
      break;
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }

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

  console.log(
    `[BULK] >>> POST received body=${JSON.stringify(body)} ` +
    `→ category="${category}" safeLimit=${safeLimit} ` +
    `topicIds=${topicIds.length} saveStatus=${saveStatus} language=${language}`
  );

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

        let allArticles;
        try {
          allArticles = await fetchAllArticlesForBulk(supabase);
        } catch (fetchErr) {
          send({ type: 'error', message: `Could not load existing articles: ${fetchErr.message}` });
          controller.close();
          return;
        }

        // Only PUBLISHED articles block. Drafts are auto-replaced.
        const publishedTopicIds = new Set(
          (allArticles || []).filter(a => a.status === 'published').map(a => a.topic_id).filter(Boolean)
        );
        const publishedSlugs = new Set(
          (allArticles || []).filter(a => a.status === 'published').map(a => a.slug).filter(Boolean)
        );

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
        const articleBySlug = new Map(
          (allArticles || []).map(a => [a.slug, existingFromRow(a)])
        );
        // Title uniqueness scoped to PUBLISHED articles in THIS language only
        const sameLangPublished = (allArticles || []).filter(
          a => a.status === 'published' && a.language === language
        );
        const allTitlesLower = new Set(
          sameLangPublished.map(a => (a.title || '').toLowerCase().trim())
        );
        const existingTitles = sameLangPublished.map(a => `  - ${a.title}`).join('\n');

        // Resolve the candidate pool. In auto-mode we keep the FULL pool and
        // iterate it until we've SAVED safeLimit articles (or the pool runs
        // out). This guarantees we never under-deliver just because the first
        // N alphabetical candidates happened to get published mid-run.
        let candidatePool;
        const targetCount = safeLimit;

        if (topicIds.length > 0) {
          const { data: topicsData, error: topicsError } = await supabase
            .from('topics')
            .select('id, name, category')
            .in('id', topicIds);

          if (topicsError || !topicsData?.length) {
            send({ type: 'error', message: 'Could not load the selected topics from the database.' });
            controller.close();
            return;
          }

          // Manual mode: the user explicitly chose these topics — process them
          // in the order they were given, capped at safeLimit.
          candidatePool = topicIds
            .map(id => topicsData.find(t => t.id === id))
            .filter(Boolean)
            .slice(0, safeLimit);
        } else {
          const { data: categoryTopics, error: catErr } = await supabase
            .from('topics')
            .select('id, name, category')
            .eq('category', category)
            .order('name')
            .limit(2000);

          if (catErr || !categoryTopics?.length) {
            send({ type: 'error', message: `No topics found for category "${category}". Add topics first.` });
            controller.close();
            return;
          }

          // Filter out already-published topics. KEEP THE FULL POOL — we'll
          // walk it until safeLimit articles are SAVED.
          candidatePool = categoryTopics.filter(t => !publishedTopicIds.has(t.id));

          console.log(
            `[BULK] auto-mode category="${category}" requested=${targetCount} ` +
            `categoryTopics=${categoryTopics.length} ` +
            `publishedInCategory=${categoryTopics.filter(t => publishedTopicIds.has(t.id)).length} ` +
            `candidatePool=${candidatePool.length}`
          );
        }

        if (!candidatePool.length) {
          send({ type: 'error', message: `Every topic in this category already has a PUBLISHED article.` });
          controller.close();
          return;
        }

        // Tell the UI we're aiming for `targetCount` (not the full pool size).
        // We may iterate more than targetCount times if some get skipped.
        console.log(`[BULK] STARTING loop — target=${targetCount} pool=${candidatePool.length} category=${category} saveStatus=${saveStatus}`);
        send({ type: 'start', total: targetCount, preSkipped: 0 });

        let generated = 0;
        let skipped   = 0;
        const total   = targetCount;

        for (let i = 0; i < candidatePool.length; i++) {
          // STOP as soon as we've saved the requested number of articles —
          // any extra candidates in the pool stay untouched for next time.
          if (generated >= targetCount) {
            console.log(`[BULK] target reached (${generated}/${targetCount}) — stopping at iteration ${i}`);
            break;
          }
          const topic = candidatePool[i];
          const slot  = generated + 1;
          console.log(`[BULK] ── iteration ${i + 1} (slot ${slot}/${targetCount}) topic="${topic.name}" ──`);
          send({ type: 'progress', current: slot, total: targetCount, topic: topic.name });

          try {
            // Concurrency-safe: re-query the DB right before the AI call so we
            // can't ever (a) overwrite a freshly-published article or (b) waste
            // a 15-25s AI call on a topic claimed by another admin session.
            const { data: liveCheck } = await supabase
              .from('articles')
              .select('id, title, slug, status, language, topics(category)')
              .eq('topic_id', topic.id)
              .limit(1);
            const existingForTopic = liveCheck?.[0] ? existingFromRow(liveCheck[0]) : null;

            if (existingForTopic) {
              if (existingForTopic.status === 'published') {
                publishedTopicIds.add(topic.id);
                publishedSlugs.add(existingForTopic.slug);
                send({
                  type: 'skipped', current: slot, total: targetCount, topic: topic.name,
                  code: 'PUBLISHED_ARTICLE_EXISTS',
                  reason: 'Published article already exists for this topic — cannot recreate',
                  existingArticle: existingForTopic,
                });
                skipped++;
                continue;
              }
              // Draft / rejected — wipe it so the new generation can proceed.
              const delErr = await deleteNonPublishedArticle(existingForTopic.id);
              if (delErr) {
                send({
                  type: 'skipped', current: slot, total: targetCount, topic: topic.name,
                  reason: `Couldn't replace existing draft: ${delErr.message}`,
                  existingArticle: existingForTopic,
                });
                skipped++;
                continue;
              }
              if (existingForTopic.slug) articleBySlug.delete(existingForTopic.slug);
            }

            // Slug pre-check (predictable categories only) — block on PUBLISHED
            // collisions, auto-delete any draft owning the slug.
            const topicCategory = topic.category || category || 'questions';
            const preCandidates = candidateSlugs(topicCategory, topic.name.trim());
            let blockedByPublishedSlug = false;
            for (const cand of preCandidates) {
              if (publishedSlugs.has(cand)) {
                const owner = articleBySlug.get(cand) || null;
                send({
                  type: 'skipped', current: slot, total: targetCount, topic: topic.name,
                  code: 'PUBLISHED_SLUG_EXISTS',
                  reason: `Slug "${cand}" is used by a PUBLISHED article — cannot recreate`,
                  existingArticle: owner,
                });
                blockedByPublishedSlug = true;
                break;
              }
              const owner = articleBySlug.get(cand);
              if (owner && owner.status !== 'published') {
                await deleteNonPublishedArticle(owner.id);
                articleBySlug.delete(cand);
              }
            }
            if (blockedByPublishedSlug) { skipped++; continue; }

            const article = await generateArticle(topic, category, existingTitles);

            // Post-AI slug check — same rule.
            if (publishedSlugs.has(article.slug)) {
              const owner = articleBySlug.get(article.slug) || null;
              send({
                type: 'skipped', current: slot, total: targetCount, topic: topic.name,
                code: 'PUBLISHED_SLUG_EXISTS',
                reason: `Slug "${article.slug}" is used by a PUBLISHED article — cannot recreate`,
                existingArticle: owner,
              });
              skipped++;
              continue;
            }
            const slugOwner = articleBySlug.get(article.slug);
            if (slugOwner && slugOwner.status !== 'published') {
              await deleteNonPublishedArticle(slugOwner.id);
              articleBySlug.delete(article.slug);
            }

            const titleLower = (article.title || '').toLowerCase().trim();
            if (allTitlesLower.has(titleLower)) {
              send({ type: 'skipped', current: slot, total: targetCount, topic: topic.name, reason: `Identical title already published in "${language}"` });
              skipped++;
              continue;
            }

            const { html: enrichedHtml } = await enrichContent(article.content);
            article.content  = enrichedHtml;
            article.status   = saveStatus;
            article.language = language;

            // Strip NUL bytes / lone surrogates that PostgreSQL refuses to
            // store ("unsupported Unicode escape sequence"). Same fix as the
            // single-article save path.
            const safeArticle = sanitizeForPg(article);

            const { data: inserted, error: insertError } = await supabase
              .from('articles').insert(safeArticle).select().single();

            if (insertError) {
              // Should be impossible after the auto-delete pass above, but the
              // 23505 path is kept for defense in depth.
              let reason = insertError.message;
              let code = null;
              let existingArticle = null;
              if (insertError.code === '23505') {
                const constraint = (insertError.constraint || insertError.details || '').toString();
                const isTopicConflict = constraint.includes('unique_topic_article') || constraint.includes('topic_id');
                code = isTopicConflict ? 'PUBLISHED_ARTICLE_EXISTS' : 'PUBLISHED_SLUG_EXISTS';
                reason = isTopicConflict
                  ? 'Published article already exists for this topic — cannot recreate'
                  : 'Slug used by a PUBLISHED article';
                existingArticle = articleBySlug.get(article.slug) || null;
              }
              send({ type: 'skipped', current: slot, total: targetCount, topic: topic.name, code, reason, existingArticle });
              skipped++;
            } else {
              if (saveStatus === 'published') {
                publishedTopicIds.add(topic.id);
                publishedSlugs.add(article.slug);
              }
              articleBySlug.set(article.slug, existingFromRow({ ...inserted, topics: { category: topicCategory } }));
              allTitlesLower.add(titleLower);
              console.log(`[BULK] ✓ saved slot ${slot}/${targetCount} slug="${article.slug}"`);
              send({ type: 'saved', current: slot, total: targetCount, title: article.title, slug: article.slug, status: saveStatus });
              generated++;
            }
          } catch (err) {
            console.error(`[BULK] ✗ iteration ${i + 1} (slot ${slot}/${targetCount}) topic "${topic.name}" THREW:`, err.stack || err.message);
            try {
              send({ type: 'skipped', current: slot, total: targetCount, topic: topic.name, reason: err.message });
            } catch (sendErr) {
              console.error(`[BULK] !! send() failed at iteration ${i + 1}:`, sendErr.message);
            }
            skipped++;
          }
        }

        console.log(`[BULK] LOOP COMPLETE — generated=${generated}/${targetCount} skipped=${skipped} pool=${candidatePool.length}`);
        send({ type: 'done', generated, skipped });
      } catch (err) {
        // OUTER catch — anything thrown OUTSIDE the per-iteration try/catch
        // ends up here and aborts the entire run. This is the most likely
        // explanation for "fewer items processed than requested" with no
        // matching skipped events.
        console.error('[BULK] !! OUTER catch (request aborted):', err.stack || err.message);
        try { send({ type: 'error', message: err.message }); } catch (_) {}
      } finally {
        try { controller.close(); } catch (_) {}
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
