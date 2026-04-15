export const dynamic = 'force-dynamic';

import { supabase } from '../../../../lib/supabase.js';
import { sanitiseSlug, getPrompt, callOpenRouter } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function generateArticle(topic, category, existingSlugs, existingTitles) {
  const contentPrompt = getPrompt(category, topic.name.trim(), '');

  const prompt = `EXISTING ARTICLES — do NOT write a duplicate of any of these:
${existingTitles || '  (none yet)'}

${contentPrompt}

Return ONLY this JSON object (no markdown, no code fences, no commentary outside the JSON):
{
  "title":            "Specific, compelling article title — not generic",
  "slug":             "url-friendly-slug-with-hyphens",
  "meta_title":       "SEO title under 60 chars",
  "meta_description": "140-155 char meta description that makes someone want to click",
  "keywords":         ["3-5 keyword strings"],
  "content":          "<p>Full article HTML. Allowed tags: p, h2, h3, ul, ol, li, strong, blockquote. Format quoted Bible verses as <blockquote> tags: <blockquote>\"Verse text\" (Book Chapter:Verse)</blockquote>. Cite unquoted verse references inline as BookName Chapter:Verse. Do NOT use h1. Do NOT use markdown.</p>"
}

HARD RULES:
- Doctrinal stance: evangelical, biblically faithful
- Slug: lowercase letters and hyphens only, no underscores, no numbers unless essential
- content field: valid HTML string, all double-quotes inside escaped as \\"
- Return ONLY the JSON — nothing before or after it`;

  const raw = await callOpenRouter([
    {
      role: 'system',
      content: `You are a senior Christian content writer with 15 years of experience writing for major Bible study publications. Your writing is known for being human, direct, and grounded in Scripture without being preachy. You write for real people dealing with real struggles — not for bots or algorithms. You always respond with valid JSON only, exactly as specified.`,
    },
    { role: 'user', content: prompt },
  ]);

  const generated = JSON.parse(raw);

  const slug = sanitiseSlug(generated.slug || generated.title || '');
  if (!slug) throw new Error('Could not generate a valid slug');

  return {
    title:            generated.title || topic.name,
    slug,
    meta_title:       generated.meta_title || generated.title || null,
    meta_description: generated.meta_description || null,
    keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
    content:          generated.content || '',
    topic_id:         topic.id || null,
    category,
    status:           'draft',
  };
}

export async function POST(request) {
  const { category, count = 5 } = await request.json();
  const safeCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data) {
        controller.enqueue(encoder.encode(sseEvent(data)));
      }

      try {
        if (!supabase) {
          send({ type: 'error', message: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' });
          controller.close();
          return;
        }

        const [{ data: topicsData, error: topicsError }, { data: existingArticles }] = await Promise.all([
          supabase.from('topics').select('id, name, category').eq('category', category || 'questions'),
          supabase.from('articles').select('slug, title, topic_id, status, category').limit(500),
        ]);

        if (topicsError || !topicsData?.length) {
          send({ type: 'error', message: `No topics found for category "${category}". Add topics first in the Topics tab.` });
          controller.close();
          return;
        }

        const usedTopicIds = new Set(
          (existingArticles || [])
            .filter(a => a.status === 'published' || a.status === 'rejected')
            .map(a => a.topic_id)
            .filter(Boolean)
        );

        const availableTopics = topicsData.filter(t => !usedTopicIds.has(t.id));

        if (!availableTopics.length) {
          send({ type: 'error', message: `All topics in "${category}" already have published or rejected articles. Add more topics first.` });
          controller.close();
          return;
        }

        const existingSlugs  = new Set((existingArticles || []).map(a => a.slug));
        const existingTitles = (existingArticles || []).map(a => `  - ${a.title}`).join('\n');

        const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
        const pickedTopics = Array.from({ length: safeCount }, (_, i) => shuffled[i % shuffled.length]);

        let generated = 0;
        let skipped   = 0;

        for (let i = 0; i < pickedTopics.length; i++) {
          const topic = pickedTopics[i];
          send({ type: 'progress', current: i + 1, total: safeCount, topic: topic.name });

          try {
            const article = await generateArticle(topic, category, existingSlugs, existingTitles);

            const slugExists = existingSlugs.has(article.slug);
            if (slugExists) {
              article.slug = `${article.slug}-${Date.now()}`;
            }

            const { data: titleCheck } = await supabase
              .from('articles')
              .select('id')
              .ilike('title', `%${article.title}%`)
              .limit(1);

            if (titleCheck?.length > 0) {
              send({ type: 'skipped', current: i + 1, total: safeCount, topic: topic.name, reason: 'Similar title already exists' });
              skipped++;
              continue;
            }

            existingSlugs.add(article.slug);

            const { html: enrichedHtml } = await enrichContent(article.content);
            article.content = enrichedHtml;

            const { error: insertError } = await supabase.from('articles').insert(article).select().single();

            if (insertError) {
              if (insertError.code === '23505') {
                send({ type: 'skipped', current: i + 1, total: safeCount, topic: topic.name, reason: 'Duplicate slug' });
                skipped++;
              } else {
                send({ type: 'skipped', current: i + 1, total: safeCount, topic: topic.name, reason: insertError.message });
                skipped++;
              }
            } else {
              send({ type: 'saved', current: i + 1, total: safeCount, title: article.title, slug: article.slug });
              generated++;
            }
          } catch (err) {
            console.error(`[bulk-generate] article ${i + 1} failed:`, err.message);
            send({ type: 'skipped', current: i + 1, total: safeCount, topic: topic.name, reason: err.message });
            skipped++;
          }
        }

        send({ type: 'done', generated, skipped, total: safeCount });
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
