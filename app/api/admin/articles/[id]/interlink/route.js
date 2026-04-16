export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase }     from '../../../../../../lib/supabase.js';
import { interlinkArticle } from '../../../../../../lib/interlinker.js';
import { stripArticleLinks } from '../../../../../../lib/seoEnrich.js';

/**
 * POST /api/admin/articles/[id]/interlink
 *
 * Strips existing injected links, runs the smart interlinker,
 * saves the updated content, and increments link_count.
 */
export async function POST(_req, { params }) {
  try {
    const { id } = params;

    // 1. Fetch the target article
    const { data: article, error: artErr } = await supabase
      .from('articles')
      .select('id, slug, title, content, topic_id, link_count, status')
      .eq('id', id)
      .single();

    if (artErr || !article) {
      return NextResponse.json({ error: artErr?.message || 'Article not found' }, { status: 404 });
    }

    // 2. Check skip condition
    if ((article.link_count || 0) >= 7) {
      return NextResponse.json({
        skipped:    true,
        link_count: article.link_count,
        message:    `Skipped — already has ${article.link_count} links (≥ 7).`,
      });
    }

    // 3. Fetch the pool: all published articles with category + pillar info
    const pool = await fetchPool();

    // 4. Strip old injected links, then interlink
    const stripped = stripArticleLinks(article.content || '');
    const { html, linksAdded } = interlinkArticle(
      { ...article, content: stripped, category: resolveCategory(article, pool) },
      pool
    );

    // 5. Save back
    const { data: saved, error: saveErr } = await supabase
      .from('articles')
      .update({
        content:    html,
        link_count: linksAdded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (saveErr) {
      // Retry without updated_at in case column absent
      const { data: saved2, error: e2 } = await supabase
        .from('articles')
        .update({ content: html, link_count: linksAdded })
        .eq('id', id)
        .select()
        .single();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json({ ...saved2, linksAdded, message: `Added ${linksAdded} links.` });
    }

    return NextResponse.json({ ...saved, linksAdded, message: `Added ${linksAdded} links.` });
  } catch (err) {
    console.error('[interlink]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchPool() {
  const all = [];
  let   from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, topic_id, link_count, topics(category, is_pillar)')
      .eq('status', 'published')
      .range(from, from + 999);

    if (error || !data?.length) break;

    for (const row of data) {
      all.push({
        id:       row.id,
        slug:     row.slug,
        title:    row.title,
        topic_id: row.topic_id,
        category: row.topics?.category || '',
        is_pillar: !!row.topics?.is_pillar,
        link_count: row.link_count || 0,
      });
    }

    if (data.length < 1000) break;
    from += 1000;
  }

  return all;
}

function resolveCategory(article, pool) {
  // article has no direct category column — get it from pool
  const match = pool.find(p => p.id === article.id);
  return match?.category || '';
}
