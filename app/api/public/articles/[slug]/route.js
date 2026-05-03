export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../../lib/supabaseAdmin.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_request, { params }) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers: CORS });
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400, headers: CORS });
  }

  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, content, meta_title, meta_description, author_name, created_at, topics(name, category)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  }

  return NextResponse.json({
    slug: data.slug,
    title: data.title,
    html_content: data.content || '',
    meta_title: data.meta_title || null,
    meta_description: data.meta_description || null,
    author_name: data.author_name || null,
    created_at: data.created_at,
    category: data.topics?.category || null,
    topic_name: data.topics?.name || null,
  }, { headers: CORS });
}
