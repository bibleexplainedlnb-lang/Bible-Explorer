import Link from 'next/link';
import { notFound } from 'next/navigation';
import { questions } from '../../../lib/db.js';
import { markdownToHtml } from '../../../lib/markdownToHtml.js';
import { addInternalLinks } from '../../../lib/internalLinks.js';
import { injectMidContentBlocks, readMoreBlock } from '../../../lib/injectReadMore.js';
import prisma from '../../../lib/prisma.js';

// ---------------------------------------------------------------------------
// Resolve question from PostgreSQL first, fall back to SQLite
// Returns a normalised shape used by both generateMetadata and the page.
// ---------------------------------------------------------------------------
async function resolveQuestion(slug) {
  // 1. Try PostgreSQL via Prisma
  try {
    const dbQ = await prisma.question.findUnique({
      where: { slug },
      include: {
        topic: { select: { id: true, name: true, slug: true } },
      },
    });

    if (dbQ) {
      return {
        source: 'db',
        title: dbQ.title,
        summary: dbQ.summary,
        topicTitle: dbQ.topic?.name ?? null,
        topicSlug: dbQ.topic?.slug ?? null,
        // Content is already HTML in Postgres — skip markdownToHtml
        rawHtml: dbQ.contentHtml,
      };
    }
  } catch (_) {
    // Prisma unavailable — fall through to SQLite
  }

  // 2. Fall back to SQLite
  const sqQ = questions.findBySlug(slug);
  if (!sqQ) return null;

  return {
    source: 'sqlite',
    title: sqQ.title,
    summary: sqQ.summary ?? null,
    topicTitle: sqQ.topic_title ?? null,
    topicSlug: sqQ.topic_slug ?? null,
    // SQLite stores markdown — convert to HTML
    rawHtml: markdownToHtml(sqQ.content),
  };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const q = await resolveQuestion(params.slug);
  if (!q) return { title: 'Not Found' };
  return {
    title: q.title,
    ...(q.summary ? { description: q.summary } : {}),
    alternates: { canonical: `/questions/${params.slug}/` },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function QuestionPage({ params }) {
  const q = await resolveQuestion(params.slug);
  if (!q) notFound();

  // Apply internal links then inject mid-content read-more blocks
  const baseHtml = addInternalLinks(q.rawHtml, {
    exclude: [`/questions/${params.slug}/`],
  });

  const block1 = q.topicSlug
    ? readMoreBlock(
        `/guides/getting-started-bible-study/`,
        'Learn more',
        `A step-by-step guide to studying ${q.topicTitle?.toLowerCase() || 'these'} passages in depth`
      )
    : readMoreBlock('/guides/getting-started-bible-study/', 'Learn more', 'A step-by-step guide to studying the Bible');

  const block2 = q.topicSlug
    ? readMoreBlock(
        `/topics/${q.topicSlug}/`,
        'Dive deeper',
        `What the Bible teaches about ${q.topicTitle?.toLowerCase()} — from Genesis to Revelation`
      )
    : readMoreBlock('/topics/', 'Explore more', 'Browse all Bible topics and themes');

  const html = injectMidContentBlocks(baseHtml, block1, block2);

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <Link href="/questions/" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        ← All Questions
      </Link>

      <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2.5rem' }}>
        {q.topicTitle && (
          <Link href={`/topics/${q.topicSlug}/`} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-block', backgroundColor: '#f5f0e8',
              color: '#8b7355', fontSize: '0.8rem', padding: '0.2rem 0.75rem',
              borderRadius: '1rem', border: '1px solid #e8dfc8',
              marginBottom: '1rem',
            }}>
              {q.topicTitle}
            </span>
          </Link>
        )}

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.875rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '2rem', lineHeight: 1.3 }}>
          {q.title}
        </h1>

        <div
          className="prose-content"
          style={{ fontFamily: 'Georgia, serif' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/questions/" style={{
          backgroundColor: '#f5f0e8', color: '#2c4270',
          padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
          fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          border: '1px solid #e8dfc8',
        }}>
          ← More Questions
        </Link>
        {q.topicSlug && (
          <Link href={`/topics/${q.topicSlug}/`} style={{
            backgroundColor: '#1e2d4a', color: 'white',
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
            fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
          }}>
            Browse {q.topicTitle} →
          </Link>
        )}
      </div>

      <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f5ee', borderRadius: '0.75rem', border: '1px solid #e8dfc8' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem', marginTop: 0 }}>
          Relevant Articles
        </h2>
        {q.topicSlug ? (
          <>
            <div className="read-more">
              <Link href={`/topics/${q.topicSlug}/`}>
                <span className="cta-label">Explore more:</span> What Scripture teaches about {q.topicTitle}
              </Link>
            </div>
            <div className="read-more">
              <Link href={`/bible-verses-about-${q.topicSlug}/`}>
                <span className="cta-label">Discover:</span> Key Bible verses on {q.topicTitle?.toLowerCase()} and their meaning
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="read-more">
              <Link href="/topics/">
                <span className="cta-label">Explore more:</span> Browse all Bible topics and themes
              </Link>
            </div>
            <div className="read-more">
              <Link href="/guides/">
                <span className="cta-label">Dive deeper:</span> Start a structured Bible study guide
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
