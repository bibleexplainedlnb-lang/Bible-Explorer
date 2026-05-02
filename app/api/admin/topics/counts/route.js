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
// Returns per-category breakdown by article status so the UI can clearly show:
//   - how many topics have a PUBLISHED article (the only true "done" state)
//   - how many have a draft awaiting review/publish
//   - how many have a rejected article
//   - how many have NO article at all (the only "missing" state)
//   - how many are "available for action" = need generation OR have a non-published draft
//     that the user might want to regenerate
//
// Shape:
//   {
//     categories: {
//       questions: { total, published, drafts, rejected, missing, unpublished, available }
//     },
//     uncategorized,
//     totals: { topics, articles, published, drafts, rejected, missing }
//   }
//
// Where:
//   - missing     = topics with NO article at all
//   - unpublished = topics whose article is NOT published (drafts + rejected)
//   - available   = missing + unpublished (everything that's NOT published)
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const [topics, articles] = await Promise.all([
      fetchAllPaginated('topics', 'id, category'),
      fetchAllPaginated('articles', 'topic_id, status'),
    ]);

    // Build topic_id -> article status map (1 topic = 1 article rule)
    const articleStatusByTopicId = new Map();
    for (const a of articles) {
      if (a.topic_id) articleStatusByTopicId.set(a.topic_id, a.status || 'draft');
    }

    const KNOWN_CATEGORIES = ['questions', 'topics', 'guides', 'bible-verses', 'bible-characters'];
    const empty = () => ({ total: 0, published: 0, drafts: 0, rejected: 0, missing: 0, unpublished: 0, available: 0 });
    const categories = Object.fromEntries(KNOWN_CATEGORIES.map(c => [c, empty()]));
    let uncategorized = 0;

    const totals = { topics: topics.length, articles: articles.length, published: 0, drafts: 0, rejected: 0, missing: 0 };

    for (const t of topics) {
      if (!t.category) { uncategorized++; continue; }
      if (!categories[t.category]) categories[t.category] = empty();
      const bucket = categories[t.category];
      bucket.total++;

      const status = articleStatusByTopicId.get(t.id);
      if (!status)                       { bucket.missing++;   totals.missing++; }
      else if (status === 'published')   { bucket.published++; totals.published++; }
      else if (status === 'rejected')    { bucket.rejected++;  totals.rejected++; }
      else                               { bucket.drafts++;    totals.drafts++; }
    }

    // Derive composite counts
    for (const c of Object.values(categories)) {
      c.unpublished = c.drafts + c.rejected;            // has article but not live
      c.available   = c.missing + c.unpublished;        // can be acted on (gen or replace)
    }

    return NextResponse.json({ categories, uncategorized, totals });
  } catch (err) {
    console.error('[topics/counts]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
