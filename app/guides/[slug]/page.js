import Link from 'next/link';
import { notFound } from 'next/navigation';
import { guides } from '../../../lib/db.js';
import { markdownToHtml } from '../../../lib/markdownToHtml.js';

export function generateMetadata({ params }) {
  const guide = guides.findBySlug(params.slug);
  if (!guide) return { title: 'Not Found' };
  return {
    title: guide.title,
    alternates: { canonical: `/guides/${params.slug}/` },
  };
}

export default function GuidePage({ params }) {
  const guide = guides.findBySlug(params.slug);
  if (!guide) notFound();

  const html = markdownToHtml(guide.content);

  return (
    <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/guides/" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        ← All Guides
      </Link>

      <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 3rem)', fontFamily: 'Georgia, serif' }}>
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/guides/" style={{
          backgroundColor: '#f5f0e8', color: '#2c4270',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          border: '1px solid #e8dfc8',
        }}>
          ← More Guides
        </Link>
      </div>

      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f5ee', borderRadius: '0.75rem', border: '1px solid #e8dfc8' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem', marginTop: 0 }}>
          Relevant Articles
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <Link href="/topics/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Browse Bible topics and themes →
            </Link>
          </li>
          <li>
            <Link href="/questions/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Common spiritual questions answered →
            </Link>
          </li>
          <li>
            <Link href="/topics/faith/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              What the Bible teaches about faith →
            </Link>
          </li>
          <li>
            <Link href="/bible-verses-about-patience/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Scriptures on patience and perseverance →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
