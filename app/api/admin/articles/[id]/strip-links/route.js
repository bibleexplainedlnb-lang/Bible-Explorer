export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../../../lib/supabaseAdmin.js';
import { stripArticleLinksOnly } from '../../../../../../lib/seoEnrich.js';

/**
 * POST /api/admin/articles/[id]/strip-links
 *
 * "De-interlink" a single article — remove all article-to-article enrichment
 * (bottom cluster section, mid-content inserts, article-link anchors, legacy
 * injected blocks) while keeping Bible verse links intact. Lets editors A/B
 * the article with vs without internal linking.
 *
 * Idempotent: running it twice produces the same content (nothing left to
 * strip on the second run).
 */
export async function POST(_req, { params }) {
  try {
    const { id } = await params;

    const { data: article, error: artErr } = await supabase
      .from('articles')
      .select('id, slug, title, content, link_count, status')
      .eq('id', id)
      .single();

    if (artErr || !article) {
      return NextResponse.json({ error: artErr?.message || 'Article not found' }, { status: 404 });
    }

    const before  = article.content || '';
    const after   = stripArticleLinksOnly(before);
    const removed = (before.match(/class="article-link"/gi) || []).length;

    let saved, saveErr;
    ({ data: saved, error: saveErr } = await supabase
      .from('articles')
      .update({ content: after, link_count: 0, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single());

    if (saveErr) {
      ({ data: saved, error: saveErr } = await supabase
        .from('articles')
        .update({ content: after, link_count: 0 })
        .eq('id', id)
        .select()
        .single());
    }
    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

    return NextResponse.json({
      ...saved,
      removed,
      message: removed > 0
        ? `Removed ${removed} internal link${removed === 1 ? '' : 's'}.`
        : 'No internal links to remove.',
    });
  } catch (err) {
    console.error('[strip-links]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
