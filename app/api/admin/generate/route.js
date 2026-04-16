export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { sanitiseSlug, uniqueSlug, getPrompt, callOpenRouter } from '../../../../lib/generator.js';
import { enrichContent } from '../../../../lib/seoEnrich.js';

const AUTHOR_NAME = 'BVI Team';
const AUTHOR_SLUG = 'bvi-team';

// Paginate through all article slugs so duplicate-prevention is complete
async function fetchAllSlugs() {
  const batchSize = 1000;
  const slugs = new Set();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('slug, title')
      .range(from, from + batchSize - 1);
    if (error || !data?.length) break;
    data.forEach(a => slugs.add(a.slug));
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return slugs;
}

export async function POST(request) {
  try {
    const { topicId, topicName, idea } = await request.json();

    if (!topicName?.trim()) return NextResponse.json({ error: 'topicName is required' }, { status: 400 });

    // Look up topic from DB — category and is_pillar are never trusted from client
    let category  = 'questions';
    let isPillar  = false;
    let articleCreated = false;

    if (topicId) {
      const { data: topic } = await supabase
        .from('topics')
        .select('id, name, category, is_pillar, article_created')
        .eq('id', topicId)
        .single();
      if (topic?.category)        category       = topic.category;
      if (topic?.is_pillar)       isPillar       = true;
      if (topic?.article_created) articleCreated = true;
    }

    // PRE-GENERATION CHECK — surface to caller so UI can confirm regeneration
    // (The UI already handles this, but we double-check server-side for safety)
    // We do NOT block here — if the user confirmed regeneration in the UI, we proceed.

    // Fetch ALL existing slugs for complete duplicate prevention
    const existingSlugs = await fetchAllSlugs();

    const contentPrompt = getPrompt(category, topicName.trim(), idea);

    // Build title / slug format hints for bible-verses and bible-characters
    let titleHint = '';
    if (category === 'bible-verses') {
      titleHint = `\nIMPORTANT: title must be "Bible Verses About ${topicName.trim()}" and slug must be "bible-verses-about-${sanitiseSlug(topicName.trim())}"`;
    } else if (category === 'bible-characters') {
      titleHint = `\nIMPORTANT: title must be "Who Was ${topicName.trim()} in the Bible?" and slug must be "who-was-${sanitiseSlug(topicName.trim())}-in-the-bible"`;
    }

    const prompt = `${contentPrompt}${titleHint}

Return ONLY this JSON object (no markdown, no code fences, no commentary outside the JSON):
{
  "title":            "Specific, compelling article title",
  "slug":             "url-friendly-slug-lowercase-hyphens-only",
  "meta_title":       "SEO title under 60 chars",
  "meta_description": "140-155 char meta description that makes someone want to click",
  "keywords":         ["3-5 keyword strings"],
  "content":          "<p>Full article HTML. Allowed tags: p, h2, h3, ul, ol, li, strong, blockquote. Format quoted Bible verses as <blockquote>\\"Verse text\\" (Book Chapter:Verse)</blockquote>. Do NOT use h1. Do NOT use markdown. All double-quotes inside must be escaped as \\".</p>"
}

HARD RULES:
- Doctrinal stance: evangelical, biblically faithful (KJV for all Bible quotes)
- Slug: lowercase letters and hyphens only, no underscores, no numbers unless essential
- content field: valid HTML string only — no broken tags, no markdown
- Return ONLY the JSON — nothing before or after it`;

    const raw = await callOpenRouter([
      {
        role: 'system',
        content: `You are a senior Christian content writer with 15 years of experience writing for major Bible study publications. Your writing is human, direct, and grounded in Scripture. You always respond with valid JSON only, exactly as specified.`,
      },
      { role: 'user', content: prompt },
    ]);

    let generated;
    try { generated = JSON.parse(raw); }
    catch { return NextResponse.json({ error: 'AI returned invalid JSON', raw }, { status: 500 }); }

    // Sanitise and deduplicate slug
    const baseSlug = sanitiseSlug(generated.slug || generated.title || topicName.trim());
    if (!baseSlug) return NextResponse.json({ error: 'Could not generate a valid slug' }, { status: 422 });
    const finalSlug = uniqueSlug(baseSlug, existingSlugs);

    // Enrich HTML
    const { html: enrichedContent } = await enrichContent(generated.content || '');

    return NextResponse.json({
      title:            generated.title,
      slug:             finalSlug,
      meta_title:       generated.meta_title,
      meta_description: generated.meta_description,
      keywords:         Array.isArray(generated.keywords) ? generated.keywords : [],
      content:          enrichedContent,
      topic_id:         topicId || null,
      status:           'draft',
      author_name:      AUTHOR_NAME,
      author_slug:      AUTHOR_SLUG,
      // Expose pillar/created info so the UI can reflect it
      _meta: { is_pillar: isPillar, article_created: articleCreated, category },
    });
  } catch (err) {
    console.error('[admin/generate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
