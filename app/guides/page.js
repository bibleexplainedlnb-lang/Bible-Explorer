import Link from 'next/link';
import { guides } from '../../lib/db.js';

export const metadata = { title: 'Study Guides' };

export default function GuidesPage() {
  const allGuides = guides.list();

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Study Guides
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '1rem', lineHeight: 1.7 }}>
          In-depth guides to help you read, understand, and apply the Bible. Whether you are just starting out or looking to go deeper, these guides are for you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {allGuides.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid #e8dfc8',
              borderRadius: '0.875rem', padding: '1.625rem',
              height: '100%', cursor: 'pointer',
            }}>
              <div style={{ color: '#d4a017', fontSize: '1.5rem', marginBottom: '0.75rem' }}>📖</div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', fontWeight: 'bold', color: '#2c4270', marginBottom: '0.625rem', lineHeight: 1.4 }}>
                {guide.title}
              </h2>
              <p style={{ color: '#6b5c45', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem' }}>
                {guide.content?.split('\n')[2]?.replace(/^#+\s*/, '').slice(0, 120) || ''}…
              </p>
              <div style={{ color: '#b8860b', fontSize: '0.875rem', fontWeight: '500' }}>
                Read guide →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
