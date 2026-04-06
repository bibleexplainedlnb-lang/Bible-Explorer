import Link from 'next/link';
import { notFound } from 'next/navigation';
import { questions } from '../../../lib/db.js';

export function generateMetadata({ params }) {
  const q = questions.findBySlug(params.slug);
  if (!q) return { title: 'Not Found' };
  return {
    title: q.title,
    alternates: { canonical: `/questions/${params.slug}/` },
  };
}

function renderContent(text) {
  if (!text) return null;
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, i) => {
    if (para.startsWith('**') && para.endsWith('**')) {
      const heading = para.slice(2, -2);
      return <h3 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 'bold', color: '#1e2d4a', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{heading}</h3>;
    }
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: '#1e2d4a' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.85, color: '#2a2015' }}>{rendered}</p>;
  });
}

export default function QuestionPage({ params }) {
  const q = questions.findBySlug(params.slug);
  if (!q) notFound();

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/questions" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        ← All Questions
      </Link>

      <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2.5rem' }}>
        {q.topic_title && (
          <Link href={`/topics/${q.topic_slug}`} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-block', backgroundColor: '#f5f0e8',
              color: '#8b7355', fontSize: '0.8rem', padding: '0.2rem 0.75rem',
              borderRadius: '1rem', border: '1px solid #e8dfc8',
              marginBottom: '1rem',
            }}>
              {q.topic_title}
            </span>
          </Link>
        )}

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.875rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '2rem', lineHeight: 1.3 }}>
          {q.title}
        </h1>

        <div style={{ fontSize: '1rem', fontFamily: 'Georgia, serif' }}>
          {renderContent(q.content)}
        </div>
      </article>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/questions" style={{
          backgroundColor: '#f5f0e8', color: '#2c4270',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          border: '1px solid #e8dfc8',
        }}>
          ← More Questions
        </Link>
        {q.topic_slug && (
          <Link href={`/topics/${q.topic_slug}`} style={{
            backgroundColor: '#1e2d4a', color: 'white',
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
            fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          }}>
            Browse {q.topic_title} →
          </Link>
        )}
      </div>
    </div>
  );
}
