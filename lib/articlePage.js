import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { notFound, permanentRedirect } from 'next/navigation';

const SITE_URL = 'https://bibleverseinsights.com';

export function getNoStoreSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

async function fetchArticle(slug) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('articles')
    .select('*, topics(name, category)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error || !data) return null;
  return data;
}

async function checkSlugRedirect(oldSlug) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('slug_redirects')
      .select('new_slug')
      .eq('old_slug', oldSlug)
      .single();
    return data?.new_slug || null;
  } catch { return null; }
}

async function fetchSameTopicArticles(topicId, currentSlug) {
  const supabase = getNoStoreSupabase();
  if (!supabase || !topicId) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug, title, topics(name, category)')
    .eq('status', 'published')
    .eq('topic_id', topicId)
    .neq('slug', currentSlug)
    .limit(3);
  return data || [];
}

async function fetchLatestArticles(currentSlug) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug, title, topics(name, category)')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(3);
  return data || [];
}

async function fetchCrossCategory(currentCategory, currentSlug) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return [];
  const otherCategories = ['guides', 'questions', 'topics'].filter(c => c !== currentCategory);
  const results = [];
  for (const cat of otherCategories) {
    const { data: topicRows } = await supabase
      .from('topics')
      .select('id')
      .eq('category', cat);
    const ids = (topicRows || []).map(t => t.id);
    if (!ids.length) continue;
    const { data } = await supabase
      .from('articles')
      .select('slug, title, topics(name, category)')
      .eq('status', 'published')
      .in('topic_id', ids)
      .neq('slug', currentSlug)
      .limit(2);
    if (data?.length) results.push(...data);
  }
  return results;
}

export function articleUrl(slug, category) {
  if (category === 'questions') return `/questions/${slug}/`;
  if (category === 'topics')    return `/topics/${slug}/`;
  return `/guides/${slug}/`;
}

const LABEL = { guides: 'Guides', questions: 'Questions', topics: 'Topics' };
const BACK  = { guides: '/guides/', questions: '/questions/', topics: '/topics/' };

const ARTICLE_STYLES = `
  .article-prose blockquote {
    margin: 1.5rem 0; padding: 1rem 1.5rem;
    background: #faf7ee; border-left: 4px solid #b8860b;
    border-radius: 0 0.5rem 0.5rem 0; font-style: italic;
    color: #3a2e1a; font-size: 1.05rem; line-height: 1.8;
  }
  .article-prose blockquote::before {
    content: '\\201C'; font-size: 2.5rem; color: #b8860b;
    line-height: 0; vertical-align: -0.6rem; margin-right: 0.2rem;
    font-family: Georgia, serif; opacity: 0.5;
  }
  .article-prose a { color: #b8860b; text-decoration: underline;
    text-decoration-color: rgba(184,134,11,0.35); text-underline-offset: 2px; transition: color 0.15s; }
  .article-prose a:hover { color: #2c4270; text-decoration-color: rgba(44,66,112,0.4); }
  .article-prose h3 {
    font-size: 1.1rem; color: #1e2d4a; margin: 2rem 0 0.75rem;
    padding-top: 1.5rem; border-top: 1px solid #e8dfc8;
    font-family: Georgia, serif; font-weight: bold;
  }
`;

const CAT_ACCENT = { guides: '#2c4270', questions: '#7c3d12', topics: '#166534' };

function RelatedCard({ article }) {
  const cat = article.topics?.category;
  const label = LABEL[cat] || cat;
  const accent = CAT_ACCENT[cat] || '#2c4270';
  return (
    <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #ede8dc' }}>
      <Link
        href={articleUrl(article.slug, cat)}
        style={{ color: accent, textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'Georgia, serif', display: 'block' }}
      >
        → {article.title}
      </Link>
      {label && (
        <span style={{ fontSize: '0.75rem', color: '#8b7355', textTransform: 'capitalize' }}>{label}</span>
      )}
    </li>
  );
}

export function makeGenerateMetadata(category) {
  return async function generateMetadata({ params }) {
    const article = await fetchArticle(params.slug);
    if (!article) return { title: 'Article Not Found' };
    const canonicalUrl = `${SITE_URL}/${category}/${params.slug}/`;
    return {
      title:       article.meta_title || article.title,
      description: article.meta_description || undefined,
      keywords:    Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
      alternates:  { canonical: canonicalUrl },
      robots:      { index: true, follow: true },
      openGraph: {
        title:       article.meta_title || article.title,
        description: article.meta_description || article.title,
        url:         canonicalUrl,
        siteName:    'Bible Verse Insights',
        type:        'article',
      },
    };
  };
}

export function makeArticlePage(category) {
  return async function ArticlePage({ params }) {
    const article = await fetchArticle(params.slug);

    if (!article) {
      const newSlug = await checkSlugRedirect(params.slug);
      if (newSlug) permanentRedirect(articleUrl(newSlug, category));
      notFound();
    }

    const articleCategory = article.topics?.category;

    if (articleCategory && articleCategory !== category) {
      permanentRedirect(articleUrl(params.slug, articleCategory));
    }

    const catLabel = LABEL[category] || 'Articles';
    const catBack  = BACK[category]  || '/';

    const sameTopic   = await fetchSameTopicArticles(article.topic_id, params.slug);
    const related     = sameTopic.length > 0 ? sameTopic : await fetchLatestArticles(params.slug);
    const crossCat    = await fetchCrossCategory(category, params.slug);

    return (
      <>
        <style suppressHydrationWarning>{ARTICLE_STYLES}</style>

        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#8b7355' }}>
            <Link href="/" style={{ color: '#b8860b', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href={catBack} style={{ color: '#b8860b', textDecoration: 'none' }}>{catLabel}</Link>
            <span>›</span>
            <span style={{ color: '#8b7355' }}>{article.title}</span>
          </div>

          <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 2px 12px rgba(30,45,74,0.06)' }}>

            <Link href={catBack} style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355',
                fontSize: '0.78rem', padding: '0.2rem 0.75rem', borderRadius: '1rem',
                border: '1px solid #e8dfc8', marginBottom: '1rem', textTransform: 'capitalize',
              }}>
                {catLabel}
              </span>
            </Link>

            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '2rem', lineHeight: 1.3 }}>
              {article.title}
            </h1>

            <div
              className="prose-content article-prose"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />
          </article>

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

          {related.length > 0 && (
            <section style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9f5ee', borderRadius: '0.75rem', border: '1px solid #e8dfc8' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem', marginTop: 0 }}>
                {sameTopic.length > 0 ? 'More on This Topic' : 'Latest Articles'}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {related.map(r => <RelatedCard key={r.slug} article={r} />)}
              </ul>
            </section>
          )}

          {crossCat.length > 0 && (
            <section style={{ marginTop: '1.25rem', padding: '1.5rem', backgroundColor: '#f0f4fa', borderRadius: '0.75rem', border: '1px solid #d4dce8' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '1rem', marginTop: 0 }}>
                Explore More
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {crossCat.map(r => <RelatedCard key={r.slug} article={r} />)}
              </ul>
            </section>
          )}

        </div>
      </>
    );
  };
}
