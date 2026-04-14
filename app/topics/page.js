export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { topics } from '../../lib/db.js';

export const metadata = { title: 'Topics' };

export default function TopicsPage() {
  const allTopics = topics.list();

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Study Topics
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '1rem', lineHeight: 1.7 }}>
          Explore key themes of the Christian faith — each topic draws together Scripture, explanation, and practical application.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {allTopics.map((topic) => (
          <Link key={topic.slug} href={`/topics/${topic.slug}/`} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid #e8dfc8',
              borderRadius: '0.875rem', padding: '1.5rem',
              height: '100%', cursor: 'pointer',
            }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 'bold', color: '#2c4270', marginBottom: '0.625rem' }}>
                {topic.title}
              </h2>
              <p style={{ color: '#6b5c45', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                {topic.description?.slice(0, 140)}{topic.description?.length > 140 ? '…' : ''}
              </p>
              <div style={{ marginTop: '1rem', color: '#b8860b', fontSize: '0.875rem', fontWeight: '500' }}>
                Explore topic →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
