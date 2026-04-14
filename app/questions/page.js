export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../lib/supabase.js';
import { isCategoryActive } from '../../lib/categories.js';

export const metadata = { title: 'Questions' };

export default async function QuestionsPage() {
  if (!isCategoryActive('questions')) notFound();
  let articles = [];

  if (supabase) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, meta_description, created_at')
      .eq('category', 'questions')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[QuestionsPage] Supabase error:', error.message);
    } else {
      articles = data || [];
      console.log('QUESTIONS ARTICLES:', articles.length, articles.map(a => a.slug));
    }
  }

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
        {articles.map((article) => (
          <Link key={article.slug} href={`/bible-verses/${article.slug}/`} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid #e8dfc8',
              borderRadius: '0.75rem', padding: '1.25rem 1.5rem',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: '600', color: '#2c4270', margin: '0 0 0.375rem' }}>
                    {article.title}
                  </h2>
                  {article.meta_description && (
                    <p style={{ margin: 0, color: '#6b5c45', fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {article.meta_description.length > 120
                        ? article.meta_description.slice(0, 120) + '…'
                        : article.meta_description}
                    </p>
                  )}
                </div>
                <span style={{ color: '#b8860b', flexShrink: 0, fontSize: '1.1rem' }}>→</span>
              </div>
            </div>
          </Link>
        ))}
        {articles.length === 0 && (
          <p style={{ color: '#8b7355', fontStyle: 'italic' }}>No questions published yet.</p>
        )}
      </div>
    </div>
  );
}
