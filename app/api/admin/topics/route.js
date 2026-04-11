export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

export async function GET() {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('category')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const { name, category } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!['topics', 'guides', 'questions'].includes(category)) {
      return NextResponse.json({ error: 'category must be topics, guides, or questions' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('topics')
      .insert({ name: name.trim(), category })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
