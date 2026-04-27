export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';

const STATUS_RANK = { published: 0, draft: 1, rejected: 2 };

export async function POST() {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  try {
    // Fetch all articles with topic_id in batches
    let all = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, status, topic_id, created_at')
        .not('topic_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, from + 999);
      if (error || !data?.length) break;
      all = all.concat(data);
      if (data.length < 1000) break;
      from += 1000;
    }

    // Group by topic_id
    const byTopic = {};
    for (const a of all) {
      if (!byTopic[a.topic_id]) byTopic[a.topic_id] = [];
      byTopic[a.topic_id].push(a);
    }

    const toDelete = [];
    const kept = [];

    for (const [, arts] of Object.entries(byTopic)) {
      if (arts.length <= 1) continue;
      // Sort: published first, then newest
      arts.sort((a, b) => {
        const sr = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
        if (sr !== 0) return sr;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      kept.push({ id: arts[0].id, slug: arts[0].slug, status: arts[0].status });
      for (const dup of arts.slice(1)) toDelete.push(dup.id);
    }

    // Delete one-by-one (most reliable with RLS)
    let deleted = 0;
    const errors = [];
    for (const id of toDelete) {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) errors.push(id + ': ' + error.message);
      else deleted++;
    }

    return NextResponse.json({
      scanned: all.length,
      duplicatesFound: toDelete.length,
      deleted,
      errors,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
