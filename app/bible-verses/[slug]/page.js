export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function fetchArticle(slug) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;
  return data;
}

async function fetchRelated(category, currentSlug) {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('articles')
    .select('slug, title, category')
    .eq('status', 'published')
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(4);

  return data || [];
}

export async function generateMetadata({ params }) {
  const article = await fetchArticle(params.slug);
  if (!article) return { title: 'Article Not Found' };

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || undefined,
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
    alternates: { canonical: `/bible-verses/${params.slug}/` },
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || undefined,
      type: 'article',
    },
  };
}

const CATEGORY_LABELS = {
  questions: 'Questions',
  guides:    'Guides',
  teachings: 'Teachings',
  topics:    'Topics',
};

const CATEGORY_BACK = {
  questions: '/questions/',
  guides:    '/guides/',
  teachings: '/teachings/',
  topics:    '/topics/',
};

export default async function ArticlePage({ params }) {
  const [article, related] = await Promise.all([
    fetchArticle(params.slug),
    fetchArticle(params.slug).then(a => a ? fetchRelated(a.category, params.slug) : []),
  ]);

  if (!article) notFound();

  const catLabel = CATEGORY_LABELS[article.category] || 'Articles';
  const catBack  = CATEGORY_BACK[article.category]  || '/';

  return (
    <>
      <style>{`
        .article-prose blockquote {
          margin: 1.5rem 0;
          padding: 1rem 1.5rem;
          background: #faf7ee;
          border-left: 4px solid #b8860b;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
          color: #3a2e1a;
          font-size: 1.05rem;
          line-height: 1.8;
        }
        .article-prose blockquote::before {
          content: '"';
          font-size: 2.5rem;
          color: #b8860b;
          line-height: 0;
          vertical-align: -0.6rem;
          margin-right: 0.2rem;
          font-family: Georgia, serif;
          opacity: 0.5;
        }
        .article-prose a {
          color: #b8860b;
          text-decoration: underline;
          text-decoration-color: rgba(184,134,11,0.35);
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .article-prose a:hover {
          color: #2c4270;
          text-decoration-color: rgba(44,66,112,0.4);
        }
        .article-prose .know-more-block {
          background: #f5f0e8;
          border-left: 3px solid #2c4270;
          padding: 0.6rem 1rem;
          border-radius: 0 0.4rem 0.4rem 0;
          margin: 1.25rem 0;
          font-size: 0.95rem;
        }
        .article-prose h3 + ul {
          list-style: none;
          padding-left: 0;
        }
        .article-prose h3 + ul li {
          padding: 0.35rem 0;
          border-bottom: 1px solid #f0ece3;
        }
        .article-prose h3 + ul li:last-child {
          border-bottom: none;
        }
        .article-prose h3 + ul li a {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 500;
        }
        .article-prose h3 + ul li a::before {
          content: '→';
          color: #b8860b;
          font-size: 0.8rem;
        }
        .article-prose h3:is(:last-of-type), .article-prose h3 {
          font-size: 1.1rem;
          color: #1e2d4a;
          margin: 2rem 0 0.75rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e8dfc8;
          font-family: Georgia, serif;
          font-weight: bold;
        }
      `}</style>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#8b7355' }}>
          <Link href="/" style={{ color: '#b8860b', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href={catBack} style={{ color: '#b8860b', textDecoration: 'none' }}>{catLabel}</Link>
          <span>›</span>
          <span style={{ color: '#8b7355' }}>{article.title}</span>
        </div>

        <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 2px 12px rgba(30,45,74,0.06)' }}>

          {/* Category tag */}
          <Link href={catBack} style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355',
              fontSize: '0.78rem', padding: '0.2rem 0.75rem', borderRadius: '1rem',
              border: '1px solid #e8dfc8', marginBottom: '1rem', textTransform: 'capitalize',
            }}>
              {catLabel}
            </span>
          </Link>

          {/* Title */}
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '2rem', lineHeight: 1.3 }}>
            {article.title}
          </h1>

          {/* Article content */}
          <div
            className="prose-content article-prose"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </article>

        {/* Navigation */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href={catBack} style={{
            backgroundColor: '#f5f0e8', color: '#2c4270',
            padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
            fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem',
            border: '1px solid #e8dfc8',
          }}>
            ← More {catLabel}
          </Link>
        </div>

        {/* Related Articles (from same category — supplementary to inline enrichment) */}
        {related.length > 0 && (
          <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f5ee', borderRadius: '0.75rem', border: '1px solid #e8dfc8' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem', marginTop: 0 }}>
              More {catLabel} Articles
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {related.map(r => (
                <li key={r.slug} style={{ padding: '0.35rem 0', borderBottom: '1px solid #ede8dc' }}>
                  <Link
                    href={`/bible-verses/${r.slug}/`}
                    style={{ color: '#2c4270', textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'Georgia, serif' }}
                  >
                    → {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </>
  );
}
