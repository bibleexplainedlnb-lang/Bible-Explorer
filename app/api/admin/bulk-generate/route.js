export const dynamic = 'force-dynamic';

import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';
import { sanitiseSlug, getPrompt, buildTitleHint, callOpenRouter, enforceArticleMeta } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
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

        if (!topicIds.length) {
          send({ type: 'error', message: 'No topics selected. Choose a parent, child, or scope in the form.' });
          controller.close();
          return;
        }

        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('id, name, category')
          .in('id', topicIds);

        if (topicsError || !topicsData?.length) {
          send({ type: 'error', message: 'Could not load the selected topics from the database.' });
          controller.close();
          return;
        }

        const orderedTopics = topicIds
          .map(id => topicsData.find(t => t.id === id))
          .filter(Boolean)
          .slice(0, safeLimit);

        const { data: publishedArticles } = await supabase
          .from('articles')
          .select('slug, title, topic_id')
          .eq('status', 'published')
          .limit(5000);

        const usedTopicIds   = new Set((publishedArticles || []).map(a => a.topic_id).filter(Boolean));
        const existingSlugs  = new Set((publishedArticles || []).map(a => a.slug));
        const existingTitles = (publishedArticles || []).map(a => `  - ${a.title}`).join('\n');

        const toProcess = orderedTopics.filter(t => !usedTopicIds.has(t.id));
        const preSkipped = orderedTopics.length - toProcess.length;

        const total = toProcess.length;

        if (!total) {
          send({ type: 'error', message: `All ${orderedTopics.length} selected topic(s) already have published articles.` });
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
            const article = await generateArticle(topic, category, existingSlugs, existingTitles);

            if (existingSlugs.has(article.slug)) {
              let n = 2;
              while (existingSlugs.has(`${article.slug}-${n}`)) n++;
              article.slug = `${article.slug}-${n}`;
            }

            const titleLower = (article.title || '').toLowerCase().trim();
            const titleConflict = (publishedArticles || []).some(
              a => (a.title || '').toLowerCase().trim() === titleLower
            );
            if (titleConflict) {
              send({ type: 'skipped', current: i + 1, total, topic: topic.name, reason: 'Identical title already published' });
              skipped++;
              continue;
            }

            existingSlugs.add(article.slug);

            const { html: enrichedHtml } = await enrichContent(article.content);
            article.content = enrichedHtml;
            article.status  = saveStatus;

            const { error: insertError } = await supabase.from('articles').insert(article).select().single();

            if (insertError) {
              const reason = insertError.code === '23505' ? 'Duplicate slug' : insertError.message;
              send({ type: 'skipped', current: i + 1, total, topic: topic.name, reason });
              skipped++;
            } else {
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
