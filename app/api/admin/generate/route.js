export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { sanitiseSlug, getPrompt, callOpenRouter } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

export async function POST(request) {
  try {
    const { topicId, topicName, idea, category = 'questions' } = await request.json();

    if (!topicName?.trim()) return NextResponse.json({ error: 'topicName is required' }, { status: 400 });

    const [{ data: existing }, { data: publishedArticles }] = await Promise.all([
      supabase.from('articles').select('slug, title').limit(100),
      supabase.from('articles').select('slug, title, category').eq('status', 'published').limit(200),
    ]);

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

    const enrichedContent = enrichContent(
      generated.content,
      publishedArticles || [],
      category,
      finalSlug
    );

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
