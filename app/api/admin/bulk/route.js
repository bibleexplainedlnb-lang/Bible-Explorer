export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || process.env.Open_Router_API;
const MODEL = 'openai/gpt-4.1-mini';

function sanitiseSlug(raw = '') {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function generateOne(topicName, topicId, category, existingSlugs, idea = '') {
  const apiKey = OPENROUTER_KEY();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const prompt = `You are a biblical content writer. Generate ONE SEO-optimized Bible article.

TOPIC: ${topicName}
CATEGORY: ${category}
${idea ? `ANGLE: ${idea}` : ''}

Return ONLY this JSON (no markdown):
{
  "title": "Article title",
  "slug": "url-slug",
  "meta_title": "SEO title under 60 chars",
  "meta_description": "140-155 char description",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "content": "<p>600-800 word article HTML using <p>, <h2>, <h3>, <ul>, <li>, <strong> tags with Bible verse citations.</p>"
}

Evangelical, biblically faithful stance. Return ONLY JSON.`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bibleverseinsights.com',
      'X-Title':      'Bible Verse Insights',
    },
    body: JSON.stringify({ model: MODEL, messages: [
      { role: 'system', content: 'Biblical content expert. Respond with JSON only.' },
      { role: 'user',   content: prompt },
    ], response_format: { type: 'json_object' } }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const generated = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');

  const baseSlug = sanitiseSlug(generated.slug || generated.title || topicName);
  let slug = baseSlug;
  let suffix = 1;
  while (existingSlugs.has(slug)) { slug = `${baseSlug}-${suffix++}`; }
  existingSlugs.add(slug);

  return {
    title:            generated.title || topicName,
    slug,
    meta_title:       generated.meta_title || generated.title,
    meta_description: generated.meta_description || '',
    keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
    content:          generated.content || '',
    topic_id:         topicId || null,
    category,
    status:           'draft',
  };
}

export async function POST(request) {
  try {
    const { category, count = 3 } = await request.json();

    const safeCount = Math.min(Math.max(parseInt(count, 10) || 3, 1), 10);

    const [{ data: topicsData }, { data: existingArticles }] = await Promise.all([
      supabase.from('topics').select('id, name, category').eq('category', category || 'questions'),
      supabase.from('articles').select('slug').limit(500),
    ]);

    if (!topicsData?.length) {
      return NextResponse.json({ error: `No topics found for category "${category}". Add topics first.` }, { status: 400 });
    }

    const existingSlugs = new Set((existingArticles || []).map(a => a.slug));

    const pickedTopics = [];
    for (let i = 0; i < safeCount; i++) {
      pickedTopics.push(topicsData[i % topicsData.length]);
    }

    const results = [];
    const errors  = [];

    for (const topic of pickedTopics) {
      try {
        const article = await generateOne(topic.name, topic.id, category, existingSlugs);
        const { data: saved, error } = await supabase.from('articles').insert(article).select().single();
        if (error) { errors.push({ topic: topic.name, error: error.message }); }
        else        { results.push(saved); }
      } catch (err) {
        errors.push({ topic: topic.name, error: err.message });
      }
    }

    return NextResponse.json({ saved: results, errors, total: results.length });
  } catch (err) {
    console.error('[admin/bulk]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
