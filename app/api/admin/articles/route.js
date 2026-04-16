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

async function buildArticlesQuery(status, category, topicId, limit) {
  // Resolve topic IDs for category filter upfront
  let topicIds = null;
  if (category) {
    const { data: topicRows } = await supabase
      .from('topics')
      .select('id')
      .eq('category', category);
    topicIds = (topicRows || []).map(t => t.id);
    if (!topicIds.length) return { data: [], error: null };
  }

  // Try with is_pillar in join; fall back to without it if column absent
  for (const joinSelect of ['*, topics(name, category, is_pillar)', '*, topics(name, category)']) {
    let q = supabase
      .from('articles')
      .select(joinSelect)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status)   q = q.eq('status', status);
    if (topicId)  q = q.eq('topic_id', topicId);
    else if (topicIds) q = q.in('topic_id', topicIds);

    const { data, error } = await q;

    if (!error) return { data: data || [], error: null };
    if (!isSchemaError(error.message)) return { data: null, error };
    console.warn('[articles GET] is_pillar absent — retrying without it');
  }

  return { data: [], error: null };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   || '';
  const category = searchParams.get('category') || '';
  const topicId  = searchParams.get('topic_id') || '';
  const limit    = parseInt(searchParams.get('limit') || '200', 10);

  const { data, error } = await buildArticlesQuery(status, category, topicId, limit);

  if (error) {
    console.error('[articles GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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

    // Try insert — fall back on schema errors by removing optional columns
    let { data, error } = await supabase
      .from('articles')
      .insert(insertData)
      .select('*, topics(name, category, is_pillar)')
      .single();

    if (error && isSchemaError(error.message)) {
      console.warn('[articles POST] schema fallback pass 1 — retrying with topics(name, category)');
      ({ data, error } = await supabase
        .from('articles')
        .insert(insertData)
        .select('*, topics(name, category)')
        .single());
    }

    if (error && isSchemaError(error.message)) {
      console.warn('[articles POST] schema fallback pass 2 — removing optional SEO columns');
      const safe = stripOptional(insertData);
      ({ data, error } = await supabase
        .from('articles')
        .insert(safe)
        .select('*, topics(name, category)')
        .single());
    }

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark topic as article_created = true — fire-and-forget; silently skip if column absent
    if (topic_id) {
      supabase
        .from('topics')
        .update({ article_created: true })
        .eq('id', topic_id)
        .then(({ error: upErr }) => {
          if (upErr && !isSchemaError(upErr.message)) {
            console.warn('[articles POST] article_created update failed:', upErr.message);
          }
        });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
