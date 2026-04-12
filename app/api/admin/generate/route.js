export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || process.env.Open_Router_API;
const MODEL = 'openai/gpt-4.1-mini';

function sanitiseSlug(raw = '') {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function getPrompt(category, topic, idea) {
  const input = (idea && idea.trim()) ? idea.trim() : topic;

  if (category === 'questions') {
    return `Answer this Christian question: "${input}"

Requirements:
- 1000–1100 words
- Clear direct answer first
- Include Bible references
- Provide explanation and real-life application

Structure:
- Direct answer
- Explanation
- Bible references
- Practical takeaway

Write in a natural human tone. Avoid repetition and AI-like phrasing.`;
  }

  if (category === 'guides') {
    return `Write a detailed Christian guide: "${input}"

Requirements:
- 1300–1500 words
- Deep, practical, and actionable

Structure:
- Introduction
- 5–7 clear steps
- Bible references
- Real-life examples
- Practical application

Avoid generic content. Make it useful and engaging.`;
  }

  if (category === 'teachings') {
    return `Write a deep Christian teaching article: "${input}"

Requirements:
- 1300–1500 words
- Deep explanation with theological clarity

Structure:
- Introduction
- Background/context
- Meaning and explanation
- Bible references
- Key lessons
- Application in life

Write like a human teacher. Avoid fluff and generic AI tone.`;
  }

  return `Write a helpful Christian article about "${input}"`;
}

async function callOpenRouter(messages) {
  const apiKey = OPENROUTER_KEY();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bibleverseinsights.com',
      'X-Title':      'Bible Verse Insights',
    },
    body: JSON.stringify({ model: MODEL, messages, response_format: { type: 'json_object' } }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('OpenRouter returned empty content');
  return content;
}

export async function POST(request) {
  try {
    const { topicId, topicName, idea, category = 'questions' } = await request.json();

    if (!topicName?.trim()) return NextResponse.json({ error: 'topicName is required' }, { status: 400 });

    const { data: existing } = await supabase
      .from('articles')
      .select('slug, title')
      .limit(100);

    const existingSlugs = new Set((existing || []).map(a => a.slug));
    const existingTitles = (existing || []).map(a => `  - ${a.title}`).join('\n') || '  (none yet)';

    const contentPrompt = getPrompt(category, topicName.trim(), idea);

    const prompt = `You are an expert biblical content writer creating SEO-optimized articles for a Bible study website.

EXISTING ARTICLES (do NOT duplicate):
${existingTitles}

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

    let generated;
    try { generated = JSON.parse(raw); }
    catch { return NextResponse.json({ error: 'AI returned invalid JSON', raw }, { status: 500 }); }

    const slug = sanitiseSlug(generated.slug || generated.title || '');
    if (!slug) return NextResponse.json({ error: 'Could not generate a valid slug' }, { status: 422 });

    const finalSlug = existingSlugs.has(slug) ? `${slug}-${Date.now()}` : slug;

    return NextResponse.json({
      title:            generated.title,
      slug:             finalSlug,
      meta_title:       generated.meta_title,
      meta_description: generated.meta_description,
      keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
      content:          generated.content,
      topic_id:         topicId || null,
      category,
      intent:           category,
      status:           'draft',
    });
  } catch (err) {
    console.error('[admin/generate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
