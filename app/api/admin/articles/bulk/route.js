export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase.js';

export async function POST(request) {
  try {
    const { ids, action, status, category } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: `Deleted ${ids.length} article${ids.length !== 1 ? 's' : ''}.` });
    }

    if (action === 'set-status') {
      if (!status) return NextResponse.json({ error: 'status is required for set-status action' }, { status: 400 });
      const { error } = await supabase
        .from('articles')
        .update({ status })
        .in('id', ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: `Marked ${ids.length} article${ids.length !== 1 ? 's' : ''} as ${status}.` });
    }

    if (action === 'set-category') {
      if (!category) return NextResponse.json({ error: 'category is required for set-category action' }, { status: 400 });
      const { error } = await supabase
        .from('articles')
        .update({ category })
        .in('id', ids);
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: `Moved ${ids.length} article${ids.length !== 1 ? 's' : ''} to category "${category}".` });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error('[articles/bulk]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
