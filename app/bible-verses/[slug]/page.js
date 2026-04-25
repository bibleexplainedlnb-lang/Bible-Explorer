export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { topicSlug } from '../../../lib/topicSlug.js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

export async function generateMetadata({ params }) {
  const name = params.slug.replace(/-/g, ' ');
  return {
    title: `${name} | Bible Verses`,
    description: `Browse Bible verse articles about ${name}.`,
  };
}

export default async function BibleVersesTopicPage({ params }) {
  const supabase = getSupabase();
  if (!supabase) notFound();

  const { slug } = params;

  const { data: allParents } = await supabase
    .from('topics')
    .select('id, name')
    .eq('category', 'bible-verses')
    .is('parent_id', null);

  const parentTopic = (allParents || []).find(t => topicSlug(t.name) === slug);
  if (!parentTopic) notFound();

  const { data: childTopics } = await supabase
    .from('topics')
    .select('id, name')
    .eq('parent_id', parentTopic.id)
    .order('name');

  const childIds = (childTopics || []).map(t => t.id);
  const topicIds = childIds.length > 0 ? childIds : [parentTopic.id];

  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title, meta_description, topic_id, created_at')
    .in('topic_id', topicIds)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const displayArticles = articles || [];
  const topicById = Object.fromEntries((childTopics || []).map(t => [t.id, t]));

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#8b7355', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: '#8b7355', textDecoration: 'none' }}>Home</Link>
        {' › '}
        <Link href="/bible-verses" style={{ color: '#8b7355', textDecoration: 'none' }}>Bible Verses</Link>
        {' › '}
        {parentTopic.name}
      </p>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem' }}>
        {parentTopic.name}
      </h1>

      {(childTopics || []).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#6b5c45', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }}>Sub-topics:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {childTopics.map(child => (
              <Link
                key={child.id}
                href={`/bible-verses/${slug}/${topicSlug(child.name)}`}
                style={{
                  padding: '0.35rem 0.85rem', background: '#f5f0e8', border: '1px solid #e8dfc8',
                  borderRadius: '2rem', color: '#2c4270', textDecoration: 'none', fontSize: '0.875rem',
                }}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {displayArticles.length === 0 ? (
        <p style={{ color: '#8b7355', fontStyle: 'italic' }}>No published articles yet for this topic.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {displayArticles.map(article => {
            const childTopic = topicById[article.topic_id];
            const href = childTopic
              ? `/bible-verses/${slug}/${topicSlug(childTopic.name)}`
              : `/bible-verses/${slug}`;
            return (
              <Link key={article.id} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white', border: '1px solid #e8dfc8',
                  borderRadius: '0.875rem', padding: '1.5rem', cursor: 'pointer',
                }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 'bold', color: '#2c4270', margin: '0 0 0.625rem' }}>
                    {article.title}
                  </h2>
                  {article.meta_description && (
                    <p style={{ color: '#6b5c45', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 1rem' }}>
                      {article.meta_description.length > 140
                        ? article.meta_description.slice(0, 140) + '…'
                        : article.meta_description}
                    </p>
                  )}
                  <div style={{ color: '#b8860b', fontSize: '0.875rem', fontWeight: '500' }}>Read verse →</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
