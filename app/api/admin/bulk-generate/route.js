export const dynamic = 'force-dynamic';

import { supabase } from '../../../../lib/supabase.js';
import { sanitiseSlug, getPrompt, callOpenRouter } from '../../../../lib/generator.js';

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function generateArticle(topic, category, existingSlugs, existingTitles) {
  const contentPrompt = getPrompt(category, topic.name.trim(), '');

  const prompt = `You are an expert biblical content writer creating SEO-optimized articles for a Bible study website.

EXISTING ARTICLES (do NOT duplicate these titles):
${existingTitles || '  (none yet)'}

${contentPrompt}

Return ONLY this JSON (no markdown, no commentary):
{
  "title":            "Clear article title",
  "slug":             "url-friendly-slug",
  "meta_title":       "SEO title under 60 chars",
  "meta_description": "140-155 char meta description",
  "keywords":         ["3-5 keyword strings"],
  "content":          "<p>Full article HTML using only <p>, <h2>, <h3>, <ul>, <li>, <strong> tags. Cite Bible verses as BookName Chapter:Verse.</p>"
}

RULES:
- Doctrinal stance: evangelical, biblically faithful
- Slug: lowercase hyphens only
- Return ONLY the JSON`;

  const raw = await callOpenRouter([
    { role: 'system', content: 'You are a biblical content expert. Respond with valid JSON only.' },
    { role: 'user',   content: prompt },
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
          supabase.from('articles').select('slug, title').limit(500),
        ]);

        if (topicsError || !topicsData?.length) {
          send({ type: 'error', message: `No topics found for category "${category}". Add topics first in the Topics tab.` });
          controller.close();
          return;
        }

        const existingSlugs   = new Set((existingArticles || []).map(a => a.slug));
        const existingTitles  = (existingArticles || []).map(a => `  - ${a.title}`).join('\n');

        const shuffled = [...topicsData].sort(() => Math.random() - 0.5);
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
