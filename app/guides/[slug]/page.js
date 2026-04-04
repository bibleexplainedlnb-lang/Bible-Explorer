import Link from 'next/link';
import { notFound } from 'next/navigation';
import { guides } from '../../../lib/db.js';

export function generateMetadata({ params }) {
  const guide = guides.findBySlug(params.slug);
  if (!guide) return { title: 'Not Found' };
  return { title: guide.title };
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.5rem', lineHeight: 1.3 }}>
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#2c4270', marginTop: '2rem', marginBottom: '0.875rem', paddingTop: '1.5rem', borderTop: '1px solid #e8dfc8' }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: '1.125rem', fontWeight: 'bold', color: '#1e2d4a', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      const listItems = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(
          <li key={i} style={{ marginBottom: '0.375rem', lineHeight: 1.7 }}>
            {renderInline(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#2a2015' }}>
          {listItems}
        </ul>
      );
      continue;
    } else if (line.match(/^\d+\. /)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        listItems.push(
          <li key={i} style={{ marginBottom: '0.375rem', lineHeight: 1.7 }}>
            {renderInline(lines[i].replace(/^\d+\. /, ''))}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1rem', color: '#2a2015' }}>
          {listItems}
        </ol>
      );
      continue;
    } else if (line.trim() === '') {
      // skip blank lines between elements
    } else {
      elements.push(
        <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.85, color: '#2a2015', fontSize: '1rem' }}>
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return elements;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#1e2d4a' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function GuidePage({ params }) {
  const guide = guides.findBySlug(params.slug);
  if (!guide) notFound();

  return (
    <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/guides" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        ← All Guides
      </Link>

      <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 3rem)', fontFamily: 'Georgia, serif' }}>
        {renderMarkdown(guide.content)}
      </article>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/guides" style={{
          backgroundColor: '#f5f0e8', color: '#2c4270',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          border: '1px solid #e8dfc8',
        }}>
          ← More Guides
        </Link>
      </div>
    </div>
  );
}
