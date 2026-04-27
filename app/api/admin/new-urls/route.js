export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabaseAdmin.js';

function isSchemaError(msg = '') {
  return msg.includes('schema cache') || msg.includes('column') || msg.includes('does not exist');
}

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';

  let query = supabase
    .from('articles')
    .select('title, slug, created_at')
    .eq('status', 'published')
    .eq('exported', false)
    .order('created_at', { ascending: false });

  if (filter === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  } else if (filter === '3days') {
    const start = new Date();
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    if (isSchemaError(error.message)) {
      return NextResponse.json({ missingColumn: true, data: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bibleverseinsights.com';

  const rows = (data || []).map(row => ({
    title: row.title,
    slug: row.slug,
    url: `${appUrl}/${row.slug}/`,
    created_at: row.created_at,
  }));

  return NextResponse.json({ data: rows, count: rows.length });
}
