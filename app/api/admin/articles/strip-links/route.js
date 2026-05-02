export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../../lib/supabaseAdmin.js';
import { stripArticleLinksOnly } from '../../../../../lib/seoEnrich.js';

/**
 * POST /api/admin/articles/strip-links
 * Body: { ids?: string[] }   (omit to strip ALL non-rejected articles)
 *
 * Bulk de-interlink. Removes article-to-article enrichment from every
 * targeted article while keeping Bible verse links. Idempotent.
 */
export async function POST(request) {
  try {
    const body  = await request.json().catch(() => ({}));
    const ids   = Array.isArray(body.ids) && body.ids.length > 0 ? body.ids : null;

    // Build target list
    let targets = [];
    if (ids) {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, content')
        .in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      targets = data || [];
    } else {
      // Paginate through every non-rejected article
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('articles')
          .select('id, slug, content')
          .neq('status', 'rejected')
          .order('id', { ascending: true })
          .range(from, from + 999);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!data?.length) break;
        targets.push(...data);
        if (data.length < 1000) break;
        from += 1000;
      }
    }

    if (targets.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No articles to strip.' });
    }

    let updated = 0, totalRemoved = 0;
    const errors = [];

    for (const a of targets) {
      try {
        const before  = a.content || '';
        const after   = stripArticleLinksOnly(before);
        const removed = (before.match(/class="article-link"/gi) || []).length;

        let { error: e } = await supabase
          .from('articles')
          .update({ content: after, link_count: 0, updated_at: new Date().toISOString() })
          .eq('id', a.id);
        if (e) {
          ({ error: e } = await supabase
            .from('articles')
            .update({ content: after, link_count: 0 })
            .eq('id', a.id));
          if (e) throw new Error(e.message);
        }
        updated++;
        totalRemoved += removed;
      } catch (err) {
        errors.push({ id: a.id, slug: a.slug, error: err.message });
      }
    }

    return NextResponse.json({
      updated,
      total:        targets.length,
      totalRemoved,
      errors:       errors.length > 0 ? errors : undefined,
      message:      `Stripped internal links from ${updated} of ${targets.length} articles (removed ${totalRemoved} anchors).`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
