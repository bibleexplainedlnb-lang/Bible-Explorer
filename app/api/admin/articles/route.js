export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status');
  const category = searchParams.get('category');
  const limit    = parseInt(searchParams.get('limit') || '50', 10);

  let query = supabase
    .from('articles')
    .select('id, title, slug, status, category, created_at, topic_id, topics(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status)   query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, content, meta_title, meta_description, keywords, related_slugs, topic_id, category, status = 'draft' } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!slug?.trim())  return NextResponse.json({ error: 'slug is required' },  { status: 400 });

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: title.trim(),
        slug:  slug.trim(),
        content,
        meta_title,
        meta_description,
        keywords:      Array.isArray(keywords)      ? keywords      : [],
        related_slugs: Array.isArray(related_slugs) ? related_slugs : [],
        topic_id:      topic_id || null,
        category:      category || null,
        status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
