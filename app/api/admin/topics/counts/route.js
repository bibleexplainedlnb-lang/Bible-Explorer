export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../../lib/supabaseAdmin.js';

// PostgREST caps single responses at 1000 rows — must paginate.
async function fetchAllPaginated(table, select) {
  const batchSize = 1000;
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

// GET /api/admin/topics/counts
// Returns per-category topic counts + how many of those topics still
// have no article (i.e. are "available" for bulk generation).
//   { categories: { questions: { total, available }, ... }, uncategorized: N }
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const [topics, articles] = await Promise.all([
      fetchAllPaginated('topics', 'id, category'),
      fetchAllPaginated('articles', 'topic_id'),
    ]);

    const usedTopicIds = new Set(
      articles.map(a => a.topic_id).filter(Boolean)
    );

    // Always return an explicit zero bucket for every known admin category so
    // the UI can reliably render "all done" / counts for every dropdown option,
    // even when a category currently has no topics in the DB.
    const KNOWN_CATEGORIES = ['questions', 'topics', 'guides', 'bible-verses', 'bible-characters'];
    const categories = Object.fromEntries(
      KNOWN_CATEGORIES.map(c => [c, { total: 0, available: 0 }])
    );
    let uncategorized = 0;

    for (const t of topics) {
      if (!t.category) { uncategorized++; continue; }
      if (!categories[t.category]) categories[t.category] = { total: 0, available: 0 };
      categories[t.category].total++;
      if (!usedTopicIds.has(t.id)) categories[t.category].available++;
    }

    return NextResponse.json({
      categories,
      uncategorized,
      totals: {
        topics:   topics.length,
        articles: articles.length,
      },
    });
  } catch (err) {
    console.error('[topics/counts]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
