export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';
import { CATEGORY_VALUES } from '../../../../lib/categories.js';

function isSchemaError(msg = '') {
  return msg.includes('does not exist') || msg.includes('column') || msg.includes('schema cache');
}

// Supabase returns at most 1000 rows per request — paginate to get everything
async function fetchAllTopics() {
  const batchSize = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('category')
      .order('name')
      .range(from, from + batchSize - 1);

    if (error) return { data: null, error };
    all = all.concat(data || []);
    if (!data || data.length < batchSize) break;
    from += batchSize;
  }

  return { data: all, error: null };
}

export async function GET() {
  const { data, error } = await fetchAllTopics();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort: pillar-first within each category (is_pillar may be undefined if column absent)
  const sorted = (data || []).sort((a, b) => {
    if (a.category < b.category) return -1;
    if (a.category > b.category) return 1;
    const ap = a.is_pillar ? 1 : 0;
    const bp = b.is_pillar ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(sorted);
}

export async function POST(request) {
  try {
    const { name, category, is_pillar = false } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!CATEGORY_VALUES.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${CATEGORY_VALUES.join(', ')}` }, { status: 400 });
    }

    // Try with is_pillar first; fall back to without it if column doesn't exist
    let { data, error } = await supabase
      .from('topics')
      .insert({ name: name.trim(), category, is_pillar: !!is_pillar })
      .select()
      .single();

    if (error && isSchemaError(error.message)) {
      console.warn('[topics POST] is_pillar column absent — retrying without it');
      ({ data, error } = await supabase
        .from('topics')
        .insert({ name: name.trim(), category })
        .select()
        .single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
