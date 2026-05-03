export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';
import { CATEGORY_VALUES } from '../../../../lib/categories.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function shape(row) {
  return {
    slug: row.slug,
    title: row.title,
    meta_description: row.meta_description || null,
    category: row.topics?.category || null,
    topic_name: row.topics?.name || null,
    author_name: row.author_name || null,
    created_at: row.created_at,
  };
}

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers: CORS });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const parsedLimit  = parseInt(searchParams.get('limit')  || '50', 10);
  const parsedOffset = parseInt(searchParams.get('offset') || '0',  10);
  const limit  = Math.min(Math.max(Number.isFinite(parsedLimit)  ? parsedLimit  : 50, 1), 100);
  const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

  if (category && !CATEGORY_VALUES.includes(category)) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 400, headers: CORS });
  }

  let topicIds = null;
  if (category) {
    const { data: topicRows } = await supabase
      .from('topics')
      .select('id')
      .eq('category', category);
    topicIds = (topicRows || []).map(t => t.id);
    if (!topicIds.length) {
      return NextResponse.json({ articles: [], hasMore: false }, { headers: CORS });
    }
  }

  let q = supabase
    .from('articles')
    .select('slug, title, meta_description, author_name, created_at, topics(name, category)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (topicIds) q = q.in('topic_id', topicIds);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }

  const rows = data || [];
  const hasMore = rows.length > limit;
  const articles = (hasMore ? rows.slice(0, limit) : rows).map(shape);

  return NextResponse.json({ articles, hasMore }, { headers: CORS });
}
