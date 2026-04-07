import Link from 'next/link';
import { notFound } from 'next/navigation';
import { topics, questions, verses } from '../../../lib/db.js';

export function generateMetadata({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) return { title: 'Not Found' };
  return {
    title: topic.title,
    alternates: { canonical: `/topics/${params.slug}/` },
  };
}

function renderTopicContent(content) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a', margin: '2rem 0 0.875rem 0' }}>
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} style={{ fontFamily: 'Georgia, serif', fontSize: '1.125rem', fontWeight: '600', color: '#2c4270', margin: '1.5rem 0 0.5rem 0' }}>
          {line.slice(4)}
        </h3>
      );
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} style={{ color: '#1e2d4a' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      elements.push(
        <p key={key++} style={{ color: '#4a4035', lineHeight: 1.85, fontSize: '1rem', margin: '0 0 1rem 0' }}>
          {rendered}
        </p>
      );
    }
  }

  return elements;
}

export default function TopicPage({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) notFound();

  const relatedQuestions = questions.listByTopic(topic.id);
  const topicVerses = verses.listByTopic(topic.id);

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/topics/" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        ← All Topics
      </Link>

      <div style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.25rem' }}>
          {topic.title}
        </h1>
        <p style={{ color: '#4a4035', lineHeight: 1.8, fontSize: '1rem', margin: 0 }}>
          {topic.description}
        </p>
      </div>

      {topic.content && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2.5rem', marginBottom: '2rem' }}>
          {renderTopicContent(topic.content)}
        </div>
      )}

      {topicVerses.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.25rem' }}>
            Key Verses
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topicVerses.map((verse) => (
              <div key={verse.id} style={{
                backgroundColor: '#fffdf7',
                border: '1px solid #e8dfc8',
                borderLeft: '4px solid #b8860b',
                borderRadius: '0.625rem',
                padding: '1.25rem 1.5rem',
              }}>
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2c4270', fontSize: '1rem', lineHeight: 1.8, margin: '0 0 0.75rem 0' }}>
                  &ldquo;{verse.text}&rdquo;
                </p>
                <p style={{ fontWeight: '600', color: '#b8860b', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  — {verse.reference}
                </p>
                {verse.explanation && (
                  <p style={{ color: '#6b5c45', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                    {verse.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedQuestions.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.25rem' }}>
            Questions on {topic.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {relatedQuestions.map((q) => (
              <Link key={q.slug} href={`/questions/${q.slug}/`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white', border: '1px solid #e8dfc8',
                  borderRadius: '0.625rem', padding: '1.125rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#2c4270', fontFamily: 'Georgia, serif', fontWeight: '500', fontSize: '1rem' }}>
                    {q.title}
                  </span>
                  <span style={{ color: '#b8860b', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedQuestions.length === 0 && (
        <div style={{ backgroundColor: '#f5f0e8', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', color: '#8b7355' }}>
          <p>No questions found for this topic yet.</p>
          <Link href="/questions/" style={{ color: '#b8860b', textDecoration: 'none', fontWeight: '500' }}>
            Browse all questions →
          </Link>
        </div>
      )}

      <section style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e8dfc8' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem' }}>
          Relevant Articles
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <Link href={`/bible-verses-about-${params.slug}/`} style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Key scriptures on {topic.title.toLowerCase()} explained →
            </Link>
          </li>
          <li>
            <Link href="/questions/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Browse spiritual questions and answers →
            </Link>
          </li>
          <li>
            <Link href="/guides/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Explore Bible study guides →
            </Link>
          </li>
          <li>
            <Link href="/bible/" style={{ color: '#b8860b', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
              Read the Bible online →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
