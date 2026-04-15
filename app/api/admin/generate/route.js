export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { sanitiseSlug, getPrompt, callOpenRouter } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

export async function POST(request) {
  try {
    const { topicId, topicName, idea, category = 'questions' } = await request.json();

    if (!topicName?.trim()) return NextResponse.json({ error: 'topicName is required' }, { status: 400 });

    const { data: existing } = await supabase.from('articles').select('slug, title').limit(100);

    const existingSlugs = new Set((existing || []).map(a => a.slug));
    const existingTitles = (existing || []).map(a => `  - ${a.title}`).join('\n') || '  (none yet)';

    const contentPrompt = getPrompt(category, topicName.trim(), idea);

    const prompt = `EXISTING ARTICLES — do NOT write a duplicate of any of these:
${existingTitles}

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

    let generated;
    try { generated = JSON.parse(raw); }
    catch { return NextResponse.json({ error: 'AI returned invalid JSON', raw }, { status: 500 }); }

    const slug = sanitiseSlug(generated.slug || generated.title || '');
    if (!slug) return NextResponse.json({ error: 'Could not generate a valid slug' }, { status: 422 });

    const finalSlug = existingSlugs.has(slug) ? `${slug}-${Date.now()}` : slug;

    const { html: enrichedContent } = await enrichContent(generated.content);

    return NextResponse.json({
      title:            generated.title,
      slug:             finalSlug,
      meta_title:       generated.meta_title,
      meta_description: generated.meta_description,
      keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
      content:          enrichedContent,
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
