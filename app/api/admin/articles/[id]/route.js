export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';

export async function GET(request, { params }) {
  const { data, error } = await supabase
    .from('articles')
    .select('*, topics(name, category)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const allowed = ['title', 'slug', 'content', 'meta_title', 'meta_description', 'keywords', 'related_slugs', 'status', 'topic_id', 'category'];
    const updates = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await supabase.from('articles').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
