export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

const OPTIONAL_COLS = ['meta_title', 'meta_description', 'keywords', 'related_slugs'];

function isSchemaError(msg = '') {
  return msg.includes('schema cache') || msg.includes('column') || msg.includes('does not exist');
}

function stripOptional(obj) {
  const copy = { ...obj };
  for (const k of OPTIONAL_COLS) delete copy[k];
  return copy;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   || '';
  const category = searchParams.get('category') || '';
  const limit    = parseInt(searchParams.get('limit') || '200', 10);

  let query = supabase
    .from('articles')
    .select('*, topics(name, category)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  // Filter by topic category via topics join
  if (category) {
    const { data: topicRows } = await supabase
      .from('topics')
      .select('id')
      .eq('category', category);
    const topicIds = (topicRows || []).map(t => t.id);
    if (!topicIds.length) return NextResponse.json([]);
    query = query.in('topic_id', topicIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[articles GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, content, meta_title, meta_description, keywords, related_slugs, topic_id, status = 'draft' } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!slug?.trim())  return NextResponse.json({ error: 'slug is required' },  { status: 400 });

    const insertData = {
      title:            title.trim(),
      slug:             slug.trim(),
      content:          content          || null,
      meta_title:       meta_title       || null,
      meta_description: meta_description || null,
      keywords:         Array.isArray(keywords)      ? keywords      : [],
      related_slugs:    Array.isArray(related_slugs) ? related_slugs : [],
      topic_id:         topic_id || null,
      status,
    };

    let { data, error } = await supabase
      .from('articles')
      .insert(insertData)
      .select('*, topics(name, category)')
      .single();

    if (error && isSchemaError(error.message)) {
      console.warn('[articles POST] schema fallback — retrying without optional SEO columns');
      const safe = stripOptional(insertData);
      ({ data, error } = await supabase.from('articles').insert(safe).select('*, topics(name, category)').single());
    }

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
