export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { topics, questions, verses } from '../../../lib/db.js';
import { markdownToHtml } from '../../../lib/markdownToHtml.js';
import { addInternalLinks } from '../../../lib/internalLinks.js';
import { injectMidContentBlocks, readMoreBlock } from '../../../lib/injectReadMore.js';

export function generateMetadata({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) return { title: 'Not Found' };
  return {
    title: topic.title,
    alternates: { canonical: `/topics/${params.slug}/` },
  };
}

export default function TopicPage({ params }) {
  const topic = topics.findBySlug(params.slug);
  if (!topic) notFound();

  const relatedQuestions = questions.listByTopic(topic.id);
  const topicVerses = verses.listByTopic(topic.id);

  // Build contextual mid-content blocks
  const firstQ = relatedQuestions[0];
  const midBlock1 = firstQ
    ? readMoreBlock(`/questions/${firstQ.slug}/`, 'Find out', firstQ.title)
    : readMoreBlock('/questions/', 'Find out', `Questions readers ask about ${topic.title.toLowerCase()}`);
  const midBlock2 = readMoreBlock(
    `/bible-verses-about-${params.slug}/`,
    'Discover',
    `Key Bible verses on ${topic.title.toLowerCase()} — with full context and meaning`
  );

  // Exclude the current topic URL so the content doesn't link to itself
  const contentHtml = injectMidContentBlocks(
    addInternalLinks(markdownToHtml(topic.content), { exclude: [`/topics/${params.slug}/`] }),
    midBlock1,
    midBlock2
  );

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

      {contentHtml && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2.5rem', marginBottom: '2rem', fontFamily: 'Georgia, serif' }}>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
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
        <div className="read-more">
          <Link href={`/bible-verses-about-${params.slug}/`}>
            <span className="cta-label">Find out:</span> The most powerful Bible verses on {topic.title.toLowerCase()} — with context and meaning
          </Link>
        </div>
        <div className="read-more">
          <Link href="/guides/">
            <span className="cta-label">Dive deeper:</span> Follow a structured Bible study guide on this theme
          </Link>
        </div>
      </section>
    </div>
  );
}
