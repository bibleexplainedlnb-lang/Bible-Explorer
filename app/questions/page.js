export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { questions } from '../../lib/db.js';

export const metadata = { title: 'Questions' };

export default function QuestionsPage() {
  const allQuestions = questions.list();

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Biblical Questions
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '1rem', lineHeight: 1.7 }}>
          Clear, Scripture-grounded answers to common questions about faith, salvation, prayer, and the Christian life.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {allQuestions.map((q) => (
          <Link key={q.slug} href={`/questions/${q.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid #e8dfc8',
              borderRadius: '0.75rem', padding: '1.25rem 1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#2c4270', margin: '0 0 0.375rem' }}>
                    {q.title}
                  </h2>
                  {q.topic_title && (
                    <span style={{
                      display: 'inline-block', backgroundColor: '#f5f0e8',
                      color: '#8b7355', fontSize: '0.75rem', padding: '0.15rem 0.6rem',
                      borderRadius: '1rem', border: '1px solid #e8dfc8',
                    }}>
                      {q.topic_title}
                    </span>
                  )}
                </div>
                <span style={{ color: '#b8860b', flexShrink: 0, fontSize: '1.1rem' }}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
