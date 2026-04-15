export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';
import { stripArticleLinks, enrichContent } from '../../../../../lib/seoEnrich.js';

/**
 * POST /api/admin/articles/relink
 * Body: { ids: ['uuid', ...] }  — or omit ids to re-link ALL non-rejected articles.
 *
 * Strips existing enrichment (article links, Know More, Related, Read More)
 * and re-runs the full enrichment pipeline with the current article pool.
 * Bible verse links are also refreshed.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids } = body;

    // 1. Fetch all non-rejected articles (the enrichment pool)
    const { data: allArticles, error: fetchErr } = await supabase
      .from('articles')
      .select('id, slug, title, category, content, status')
      .neq('status', 'rejected')
      .limit(500);

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // 2. Determine which articles to re-link
    const targetIds = Array.isArray(ids) && ids.length > 0
      ? new Set(ids)
      : null; // null = all

    const targets = targetIds
      ? (allArticles || []).filter(a => targetIds.has(a.id))
      : (allArticles || []);

    if (targets.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No articles to re-link.' });
    }

    const pool = allArticles || [];
    let updated = 0;
    const errors = [];

    for (const article of targets) {
      try {
        // Strip existing enrichment
        const stripped = stripArticleLinks(article.content || '');

        // Re-run enrichment pipeline (Bible verse links only)
        const { html: enriched } = await enrichContent(stripped);

        // Save back
        const { error: updateErr } = await supabase
          .from('articles')
          .update({ content: enriched, updated_at: new Date().toISOString() })
          .eq('id', article.id);

        if (updateErr) {
          // Try without updated_at if column doesn't exist
          const { error: retryErr } = await supabase
            .from('articles')
            .update({ content: enriched })
            .eq('id', article.id);
          if (retryErr) throw new Error(retryErr.message);
        }

        updated++;
      } catch (err) {
        errors.push({ id: article.id, slug: article.slug, error: err.message });
      }
    }

    return NextResponse.json({
      updated,
      total: targets.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Re-linked ${updated} of ${targets.length} articles.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
