export const dynamic = 'force-dynamic';

import { NextResponse }      from 'next/server';
import { supabase }          from '../../../../../lib/supabase.js';
import { stripArticleLinks, enrichContent } from '../../../../../lib/seoEnrich.js';
import { interlinkArticle }  from '../../../../../lib/interlinker.js';

/**
 * POST /api/admin/articles/relink
 * Body (all optional):
 *   ids    – string[]  specific article IDs; omit to re-link ALL non-rejected
 *   smart  – boolean   use smart interlinker (default true)
 *   force  – boolean   re-link even if link_count >= 7 (default false)
 *
 * Strips old injected links, re-runs the full pipeline:
 *   1. Smart internal linking (Related, Explore More, contextual)
 *   2. Bible verse blockquotes + /bible/ links
 * Updates link_count and updated_at.
 */
export async function POST(request) {
  try {
    const body    = await request.json().catch(() => ({}));
    const { ids, smart = true, force = false } = body;

    // 1. Fetch all published/draft articles as the enrichment pool
    const pool = await fetchPool();

    // 2. Determine targets
    const targetSet = Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
    const targets   = targetSet
      ? pool.filter(a => targetSet.has(a.id))
      : pool.filter(a => a.status !== 'rejected');

    if (targets.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No articles to re-link.' });
    }

    let updated = 0;
    const errors = [];

    for (const article of targets) {
      try {
        // Fetch full content for this article
        const { data: full, error: fErr } = await supabase
          .from('articles')
          .select('id, slug, title, content, topic_id, link_count, status')
          .eq('id', article.id)
          .single();

        if (fErr || !full) throw new Error(fErr?.message || 'Not found');

        // Skip if forced=false AND already has many links — but user removed the cap,
        // so only skip if explicitly told to (force=false is now a soft hint, not enforced)
        if (force === false && (full.link_count || 0) >= 20) continue; // safety ceiling at 20

        // Strip old links
        const stripped = stripArticleLinks(full.content || '');

        let html = stripped;
        let linksAdded = 0;

        // Smart interlinking
        if (smart) {
          const { html: linked, linksAdded: n } = interlinkArticle(
            { ...full, content: stripped, category: article.category },
            pool
          );
          html       = linked;
          linksAdded = n;
        }

        // Bible verse enrichment (blockquotes + /bible/ links)
        const { html: enriched } = await enrichContent(html);
        html = enriched;

        // Save back
        const { error: updateErr } = await supabase
          .from('articles')
          .update({ content: html, link_count: linksAdded, updated_at: new Date().toISOString() })
          .eq('id', article.id);

        if (updateErr) {
          // Retry without updated_at
          const { error: e2 } = await supabase
            .from('articles')
            .update({ content: html, link_count: linksAdded })
            .eq('id', article.id);
          if (e2) throw new Error(e2.message);
        }

        updated++;
      } catch (err) {
        errors.push({ id: article.id, slug: article.slug, error: err.message });
      }
    }

    return NextResponse.json({
      updated,
      total:   targets.length,
      errors:  errors.length > 0 ? errors : undefined,
      message: `Re-linked ${updated} of ${targets.length} articles.`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── Fetch pool (paginated, incl. category + is_pillar) ──────────────────────

async function fetchPool() {
  const all  = [];
  let   from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, topic_id, link_count, status, topics(category, is_pillar)')
      .neq('status', 'rejected')
      .range(from, from + 999);

    if (error || !data?.length) break;

    for (const row of data) {
      all.push({
        id:        row.id,
        slug:      row.slug,
        title:     row.title,
        topic_id:  row.topic_id,
        category:  row.topics?.category || '',
        is_pillar: !!row.topics?.is_pillar,
        link_count: row.link_count || 0,
        status:    row.status,
      });
    }

    if (data.length < 1000) break;
    from += 1000;
  }

  return all;
}
