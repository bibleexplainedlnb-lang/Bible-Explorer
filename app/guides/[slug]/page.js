export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { guides } from '../../../lib/db.js';
import { markdownToHtml } from '../../../lib/markdownToHtml.js';
import { addInternalLinks } from '../../../lib/internalLinks.js';
import { injectMidContentBlocks, GUIDE_MID_BLOCKS } from '../../../lib/injectReadMore.js';

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

  const baseHtml = addInternalLinks(markdownToHtml(guide.content), {
    exclude: [`/guides/${params.slug}/`],
  });

  const midBlocks = GUIDE_MID_BLOCKS[params.slug];
  const html = midBlocks
    ? injectMidContentBlocks(baseHtml, midBlocks[0], midBlocks[1])
    : baseHtml;

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
        <div className="read-more">
          <Link href="/topics/">
            <span className="cta-label">Learn more:</span> Browse all Bible topics — faith, grace, love, and more
          </Link>
        </div>
        <div className="read-more">
          <Link href="/questions/">
            <span className="cta-label">Understand:</span> Answers to the most common spiritual questions
          </Link>
        </div>
      </section>
    </div>
  );
}
