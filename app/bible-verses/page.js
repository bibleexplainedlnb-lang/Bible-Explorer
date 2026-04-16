export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isCategoryActive } from '../../lib/categories.js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export const metadata = {
  title: 'Bible Verses | Bible Verse Insights',
  description: 'Explore key Bible verses with in-depth explanations, context, and practical application for daily Christian living.',
};

export default async function BibleVersesPage() {
  if (!isCategoryActive('bible-verses')) notFound();

  let articles = [];
  const supabase = getSupabase();

  if (supabase) {
    const { data: topicRows } = await supabase
      .from('topics')
      .select('id')
      .eq('category', 'bible-verses');

    const topicIds = (topicRows || []).map(t => t.id);

    if (topicIds.length > 0) {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, meta_description, created_at')
        .in('topic_id', topicIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BibleVersesPage] Supabase error:', error.message);
      } else {
        articles = data || [];
      }
    }
  }

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#8b7355', marginBottom: '0.75rem' }}>
          <Link href="/" style={{ color: '#8b7355', textDecoration: 'none' }}>Home</Link>
          {' › '}Bible Verses
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Bible Verses
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '1rem', lineHeight: 1.7 }}>
          Explore key Scripture passages with verse-by-verse explanation, historical context, and practical application for everyday faith.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {articles.map((article) => (
          <Link key={article.slug} href={`/bible-verses/${article.slug}/`} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e8dfc8',
              borderRadius: '0.875rem',
              padding: '1.5rem',
              height: '100%',
              cursor: 'pointer',
            }}>
              <h2 style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#2c4270',
                margin: '0 0 0.625rem',
              }}>
                {article.title}
              </h2>
              {article.meta_description && (
                <p style={{ color: '#6b5c45', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                  {article.meta_description.length > 140
                    ? article.meta_description.slice(0, 140) + '…'
                    : article.meta_description}
                </p>
              )}
              <div style={{ marginTop: 'auto', color: '#b8860b', fontSize: '0.875rem', fontWeight: '500' }}>
                Read verse →
              </div>
            </div>
          </Link>
        ))}
        {articles.length === 0 && (
          <p style={{ color: '#8b7355', fontStyle: 'italic' }}>No Bible verse articles published yet.</p>
        )}
      </div>
    </div>
  );
}
