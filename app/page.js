export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabase } from '../lib/supabase.js';

const FEATURED_PASSAGES = [
  { book: 'john',        chapter: 3,  label: 'John 3',      desc: 'Born Again — Jesus and Nicodemus' },
  { book: 'psalms',      chapter: 23, label: 'Psalm 23',    desc: 'The Lord Is My Shepherd' },
  { book: 'romans',      chapter: 8,  label: 'Romans 8',    desc: 'No Condemnation in Christ' },
  { book: 'matthew',     chapter: 5,  label: 'Matthew 5',   desc: 'The Sermon on the Mount' },
  { book: 'genesis',     chapter: 1,  label: 'Genesis 1',   desc: 'In the Beginning — Creation' },
  { book: '1corinthians',chapter: 13, label: '1 Cor 13',    desc: 'The Love Chapter' },
];

export default async function Home() {
  let recentGuides    = [];
  let recentQuestions = [];

  if (supabase) {
    const [guidesRes, questionsRes] = await Promise.all([
      supabase
        .from('articles')
        .select('slug, title')
        .eq('category', 'guides')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('articles')
        .select('slug, title')
        .eq('category', 'questions')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    recentGuides    = guidesRes.data    || [];
    recentQuestions = questionsRes.data || [];
  }

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
      <section style={{
        background: 'linear-gradient(135deg, #1e2d4a 0%, #2c4270 100%)',
        borderRadius: '0 0 1.5rem 1.5rem',
        padding: '4rem 2rem',
        textAlign: 'center',
        marginBottom: '3rem',
        color: 'white',
      }}>
        <p style={{ color: '#d4a017', fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
          Thy word is a lamp unto my feet — Psalm 119:105
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 'bold', marginBottom: '1.25rem', lineHeight: 1.2 }}>
          Explore the Word of God
        </h1>
        <p style={{ color: '#c8d8e8', fontSize: '1.1rem', maxWidth: '40rem', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Read the King James Bible, study topics, find answers to spiritual questions, and grow in your faith through carefully curated guides.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/bible/john/1/" style={{
            backgroundColor: '#d4a017', color: '#1a1208',
            padding: '0.75rem 2rem', borderRadius: '0.5rem',
            fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem',
          }}>
            Start Reading →
          </Link>
          <Link href="/guides/" style={{
            backgroundColor: 'transparent', color: 'white',
            padding: '0.75rem 2rem', borderRadius: '0.5rem',
            fontWeight: '500', textDecoration: 'none', fontSize: '1rem',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            Browse Guides
          </Link>
        </div>
      </section>

      <section style={{
        backgroundColor: '#fffdf7',
        border: '1px solid #e8dfc8',
        borderLeft: '4px solid #b8860b',
        borderRadius: '0.75rem',
        padding: '1.75rem 2rem',
        marginBottom: '3rem',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.15rem', color: '#2c4270', lineHeight: 1.8, margin: '0 0 0.75rem 0' }}>
          &ldquo;For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.&rdquo;
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/bible/john/3/" style={{ color: '#b8860b', fontWeight: '600', textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}>
            John 3:16 — Read in context →
          </Link>
        </p>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1.5rem', textAlign: 'center' }}>
          Featured Passages
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {FEATURED_PASSAGES.map(({ book, chapter, label, desc }) => (
            <Link key={`${book}-${chapter}`} href={`/bible/${book}/${chapter}/`} className="passage-card" style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white', border: '1px solid #e8dfc8',
                borderRadius: '0.75rem', padding: '1.25rem',
              }}>
                <div style={{ color: '#d4a017', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                  {label}
                </div>
                <div style={{ color: '#4a4035', fontSize: '0.9rem', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a' }}>
              Study Guides
            </h2>
            <Link href="/guides/" style={{ color: '#b8860b', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '500' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentGuides.length === 0 && (
              <p style={{ color: '#8b7355', fontSize: '0.875rem', fontStyle: 'italic' }}>No guides published yet.</p>
            )}
            {recentGuides.map((article) => (
              <Link key={article.slug} href={`/bible-verses/${article.slug}/`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white', border: '1px solid #e8dfc8',
                  borderRadius: '0.5rem', padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#2c4270', fontWeight: '500', fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>{article.title}</span>
                  <span style={{ color: '#b8860b', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#1e2d4a' }}>
              Questions Answered
            </h2>
            <Link href="/questions/" style={{ color: '#b8860b', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '500' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentQuestions.length === 0 && (
              <p style={{ color: '#8b7355', fontSize: '0.875rem', fontStyle: 'italic' }}>No questions published yet.</p>
            )}
            {recentQuestions.map((article) => (
              <Link key={article.slug} href={`/bible-verses/${article.slug}/`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white', border: '1px solid #e8dfc8',
                  borderRadius: '0.5rem', padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#2c4270', fontWeight: '500', fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}>{article.title}</span>
                  <span style={{ color: '#b8860b', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section style={{
        backgroundColor: '#f5f0e8', border: '1px solid #e8dfc8',
        borderRadius: '1rem', padding: '2.5rem', textAlign: 'center', marginBottom: '3rem',
      }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Have a Question?
        </h2>
        <p style={{ color: '#6b5c45', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          Browse our library of answered questions about faith, salvation, prayer, and more.
        </p>
        <Link href="/questions/" style={{
          backgroundColor: '#1e2d4a', color: 'white',
          padding: '0.65rem 1.75rem', borderRadius: '0.5rem',
          fontWeight: '500', textDecoration: 'none', fontSize: '0.95rem',
          display: 'inline-block',
        }}>
          Browse Questions
        </Link>
      </section>
    </div>
  );
}
