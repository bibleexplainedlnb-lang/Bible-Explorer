import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { notFound, permanentRedirect } from 'next/navigation';

/**
 * Sanitize article HTML for safe display:
 *  1. Remove old injected bottom sections (h3[data-injected] + ul[data-injected])
 *     and legacy heading+list blocks stored by older interlinker versions.
 *  2. Unwrap malformed anchors (those wrapping block elements or spanning > 10 words).
 *  3. Add overflow-wrap to prevent text from escaping the page.
 */
function sanitizeForDisplay(html) {
  if (!html) return '';
  let result = html;

  // Strip old injected h3/h2 sections + their following ul/ol (data-injected attribute)
  result = result.replace(
    /<h[23][^>]*data-injected="true"[^>]*>[\s\S]*?<\/h[23]>\s*(?:<[uo]l[^>]*data-injected="true"[^>]*>[\s\S]*?<\/[uo]l>)?/gi,
    ''
  );

  // Strip legacy plain heading+list blocks (Related Articles, Read More, etc.)
  result = result.replace(
    /<h[23]>\s*(?:Related Articles|Read More|Explore More|See Also|Know More|Latest Articles)[^<]*<\/h[23]>\s*<[uo]l>[\s\S]*?<\/[uo]l>/gi,
    ''
  );

  // Strip data-injected paragraphs
  result = result.replace(/<p[^>]*data-injected="true"[^>]*>[\s\S]*?<\/p>/gi, '');

  // Unwrap malformed anchors (wrapping block-level elements or > 10 words)
  const BLOCK_TAG = /^<(?:h[1-6]|p|blockquote|ul|ol|li|div|section|article|table)\b/i;
  result = result.replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, (match, inner) => {
    if (BLOCK_TAG.test(inner.trimStart())) return inner;
    const wordCount = inner.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 10) return inner;
    return match;
  });

  // Collapse multiple blank lines left by removed sections
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

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

// ── Section data fetching ─────────────────────────────────────────────────────

async function fetchReadMore(category, currentSlug, limit = 4) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug, title, topics(name, category)')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(30);
  return (data || [])
    .filter(a => a.topics?.category === category)
    .slice(0, limit);
}

async function fetchRelatedArticles(topicId, currentSlug, limit = 4) {
  const supabase = getNoStoreSupabase();
  if (!supabase || !topicId) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug, title, topics(name, category)')
    .eq('status', 'published')
    .eq('topic_id', topicId)
    .neq('slug', currentSlug)
    .limit(limit);
  return data || [];
}

async function fetchExploreMore(category, currentSlug, limit = 4) {
  const supabase = getNoStoreSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('articles')
    .select('slug, title, topics(name, category)')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data || [])
    .filter(a => a.topics?.category && a.topics.category !== category)
    .slice(0, limit);
}

// ── URL helper ────────────────────────────────────────────────────────────────

export function articleUrl(slug, category) {
  if (category === 'questions')        return `/questions/${slug}/`;
  if (category === 'topics')           return `/topics/${slug}/`;
  if (category === 'bible-characters') return `/bible-characters/${slug}/`;
  if (category === 'bible-verses')     return `/bible-verses/`;
  return `/guides/${slug}/`;
}

const LABEL = {
  guides: 'Guides', questions: 'Questions', topics: 'Topics',
  'bible-verses': 'Bible Verses', 'bible-characters': 'Bible Characters',
};
const BACK = {
  guides: '/guides/', questions: '/questions/', topics: '/topics/',
  'bible-verses': '/bible-verses/', 'bible-characters': '/bible-characters/',
};

// ── Styles ────────────────────────────────────────────────────────────────────

export const ARTICLE_STYLES = `
  .article-prose {
    overflow-wrap: break-word;
    word-break: break-word;
    max-width: 100%;
  }
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
  .article-prose a {
    color: #1a56db; text-decoration: underline;
    text-decoration-color: rgba(26,86,219,0.35); text-underline-offset: 2px;
    transition: color 0.15s; overflow-wrap: break-word; word-break: break-word;
  }
  .article-prose a:hover { color: #1e40af; text-decoration-color: rgba(30,64,175,0.5); }
  .article-prose .verse-ref {
    color: #b8860b !important;
    text-decoration-color: rgba(184,134,11,0.35) !important;
  }
  .article-prose .verse-ref:hover { color: #2c4270 !important; }
  .article-prose h2, .article-prose h3 {
    overflow-wrap: break-word; word-break: break-word;
  }
  .article-prose h3 {
    font-size: 1.1rem; color: #1e2d4a; margin: 2rem 0 0.75rem;
    padding-top: 1.5rem; border-top: 1px solid #e8dfc8;
    font-family: Georgia, serif; font-weight: bold;
  }
`;

// ── Link section component ────────────────────────────────────────────────────

function ArticleLinkSection({ heading, articles }) {
  if (!articles.length) return null;
  return (
    <section style={{ marginTop: '1.5rem', backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', boxShadow: '0 1px 6px rgba(30,45,74,0.05)' }}>
      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: '700', color: '#1e2d4a', marginBottom: '0.75rem', marginTop: 0 }}>
        {heading}
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {articles.map(a => {
          const cat = a.topics?.category;
          return (
            <li key={a.slug} style={{ padding: '0.4rem 0', borderBottom: '1px solid #f0ebe0' }}>
              <Link
                href={articleUrl(a.slug, cat)}
                style={{ color: '#1a56db', textDecoration: 'none', fontSize: '0.95rem', fontFamily: 'Georgia, serif', display: 'block' }}
              >
                → {a.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Factory functions ─────────────────────────────────────────────────────────

export function makeGenerateMetadata(category) {
  return async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await fetchArticle(slug);
    if (!article) return { title: 'Article Not Found' };
    const canonicalUrl = `${SITE_URL}/${category}/${slug}/`;
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
    const { slug } = await params;
    const article = await fetchArticle(slug);

    if (!article) {
      const newSlug = await checkSlugRedirect(slug);
      if (newSlug) permanentRedirect(articleUrl(newSlug, category));
      notFound();
    }

    const articleCategory = article.topics?.category;
    if (articleCategory && articleCategory !== category) {
      permanentRedirect(articleUrl(slug, articleCategory));
    }

    const catLabel = LABEL[category] || 'Articles';
    const catBack  = BACK[category]  || '/';

    // Fetch bottom sections in parallel (max 4 each, server-side, always fresh)
    const [readMore, related, exploreMore] = await Promise.all([
      fetchReadMore(category, slug, 4),
      fetchRelatedArticles(article.topic_id, slug, 4),
      fetchExploreMore(category, slug, 4),
    ]);

    // Deduplicate across sections
    const usedSlugs = new Set([slug]);
    const deduped = (arr) => arr.filter(a => { if (usedSlugs.has(a.slug)) return false; usedSlugs.add(a.slug); return true; });
    const readMoreItems    = deduped(readMore);
    const relatedItems     = deduped(related);
    const exploreMoreItems = deduped(exploreMore);

    // Sanitize content: strip old injected sections + malformed anchors
    const cleanContent = sanitizeForDisplay(article.content || '');

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

          <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 2px 12px rgba(30,45,74,0.06)', overflow: 'hidden' }}>

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
              dangerouslySetInnerHTML={{ __html: cleanContent }}
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

          {/* Bottom sections: Read More → Related Articles → Explore More (max 4 each) */}
          <ArticleLinkSection heading="Read More"        articles={readMoreItems} />
          <ArticleLinkSection heading="Related Articles" articles={relatedItems} />
          <ArticleLinkSection heading="Explore More"     articles={exploreMoreItems} />

        </div>
      </>
    );
  };
}
