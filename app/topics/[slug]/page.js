import Link from 'next/link';
import { notFound } from 'next/navigation';
import { topics, questions } from '../../../lib/db.js';

export function generateMetadata({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) return { title: 'Not Found' };
  return { title: topic.title };
}

export default function TopicPage({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) notFound();

  const relatedQuestions = questions.listByTopic(topic.id);

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/topics" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
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

      {relatedQuestions.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.25rem' }}>
            Questions on {topic.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {relatedQuestions.map((q) => (
              <Link key={q.slug} href={`/questions/${q.slug}`} style={{ textDecoration: 'none' }}>
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
          <Link href="/questions" style={{ color: '#b8860b', textDecoration: 'none', fontWeight: '500' }}>
            Browse all questions →
          </Link>
        </div>
      )}
    </div>
  );
}
