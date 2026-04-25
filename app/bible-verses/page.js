export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { isCategoryActive } from '../../lib/categories.js';
import { topicSlug } from '../../lib/topicSlug.js';

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
  description: 'Browse Bible verse collections organised by topic.',
  robots: { index: true, follow: true },
};

export default async function BibleVersesPage() {
  if (!isCategoryActive('bible-verses')) notFound();

  const supabase = getSupabase();
  let parentTopics = [];

  if (supabase) {
    const batchSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .eq('category', 'bible-verses')
        .is('parent_id', null)
        .order('name')
        .range(from, from + batchSize - 1);
      if (error || !data?.length) break;
      parentTopics = parentTopics.concat(data);
      if (data.length < batchSize) break;
      from += batchSize;
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
          Browse Bible verse collections organised by topic.
        </p>
      </div>

      {parentTopics.length === 0 ? (
        <p style={{ color: '#8b7355', fontStyle: 'italic' }}>
          No topics yet. Add parent topics (with no parent_id) in the admin panel.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {parentTopics.map(topic => (
            <Link key={topic.id} href={`/bible-verses-about-${topicSlug(topic.name)}/`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white', border: '1px solid #e8dfc8',
                borderRadius: '0.875rem', padding: '1.25rem', cursor: 'pointer',
              }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: 'bold', color: '#2c4270', margin: 0 }}>
                  {topic.name}
                </h2>
                <p style={{ margin: '0.5rem 0 0', color: '#b8860b', fontSize: '0.85rem' }}>Browse verses →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
