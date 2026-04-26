export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';

async function fetchAllTopics() {
  const batchSize = 1000;
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('topics')
      .select('id, name, category, parent_id, is_pillar, article_created')
      .order('name')
      .range(from, from + batchSize - 1);
    if (error) return { data: null, error };
    all = all.concat(data || []);
    if (!data || data.length < batchSize) break;
    from += batchSize;
  }
  return { data: all, error: null };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || null;

  const { data, error } = await fetchAllTopics();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = data || [];
  const filtered = category ? all.filter(t => t.category === category) : all;

  const parents  = filtered.filter(t => !t.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  const children = filtered.filter(t =>  t.parent_id);

  const childMap = {};
  for (const c of children) {
    if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
    childMap[c.parent_id].push(c);
  }
  for (const id of Object.keys(childMap)) {
    childMap[id].sort((a, b) => a.name.localeCompare(b.name));
  }

  const hierarchy = parents.map(p => ({
    id:              p.id,
    name:            p.name,
    category:        p.category,
    is_pillar:       p.is_pillar,
    article_created: p.article_created,
    children:        childMap[p.id] || [],
  }));

  const orphans = children.filter(c => !filtered.find(p => p.id === c.parent_id));
  const orphanNodes = orphans.map(o => ({
    id:              o.id,
    name:            o.name,
    category:        o.category,
    is_pillar:       o.is_pillar,
    article_created: o.article_created,
    children:        [],
    _orphan:         true,
  }));

  return NextResponse.json([...hierarchy, ...orphanNodes]);
}
