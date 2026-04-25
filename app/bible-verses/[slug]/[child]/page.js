export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { topicSlug } from '../../../../lib/topicSlug.js';
import { ARTICLE_STYLES } from '../../../../lib/articlePage.js';

const SITE_URL = 'https://bibleverseinsights.com';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}

async function resolveArticle(parentSlug, childSlug) {
  const supabase = getSupabase();
  if (!supabase) return {};

  const { data: allParents } = await supabase
    .from('topics')
    .select('id, name')
    .eq('category', 'bible-verses')
    .is('parent_id', null);

  const parentTopic = (allParents || []).find(t => topicSlug(t.name) === parentSlug);
  if (!parentTopic) return {};

  const { data: siblings } = await supabase
    .from('topics')
    .select('id, name')
    .eq('parent_id', parentTopic.id)
    .order('name');

  const childTopic = (siblings || []).find(t => topicSlug(t.name) === childSlug);
  if (!childTopic) return { parentTopic };

  const { data: articleRows } = await supabase
    .from('articles')
    .select('*')
    .eq('topic_id', childTopic.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);

  const siblingLinks = (siblings || []).filter(t => t.id !== childTopic.id);

  return {
    article: (articleRows || [])[0] || null,
    parentTopic,
    childTopic,
    siblings: siblingLinks,
  };
}

export async function generateMetadata({ params }) {
  const { article, parentTopic } = await resolveArticle(params.slug, params.child);
  if (!article) return { title: 'Article Not Found', robots: { index: false } };
  const canonical = `${SITE_URL}/bible-verses-about-${params.slug}/${params.child}/`;
  return {
    title:       article.meta_title || article.title,
    description: article.meta_description || undefined,
    keywords:    Array.isArray(article.keywords) ? article.keywords.join(', ') : undefined,
    alternates:  { canonical },
    robots:      { index: true, follow: true },
    openGraph: {
      title:       article.meta_title || article.title,
      description: article.meta_description || article.title,
      url:         canonical,
      siteName:    'Bible Verse Insights',
      type:        'article',
    },
  };
}

const RELATED_CATEGORIES = [
  { href: '/guides/',     label: 'Bible Guides' },
  { href: '/questions/',  label: 'Bible Questions' },
];

export default async function BibleVersesChildPage({ params }) {
  const { article, parentTopic, childTopic, siblings } = await resolveArticle(params.slug, params.child);

  if (!parentTopic) notFound();
  if (!article)     notFound();

  const { slug, child } = params;

  return (
    <>
      <style suppressHydrationWarning>{ARTICLE_STYLES}</style>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#8b7355', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#b8860b', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/bible-verses/" style={{ color: '#b8860b', textDecoration: 'none' }}>Bible Verses</Link>
          <span>›</span>
          <Link href={`/bible-verses-about-${slug}/`} style={{ color: '#b8860b', textDecoration: 'none' }}>
            {parentTopic.name}
          </Link>
          <span>›</span>
          <span style={{ color: '#8b7355' }}>{childTopic?.name || article.title}</span>
        </div>

        <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 2px 12px rgba(30,45,74,0.06)' }}>

          <Link href="/bible-verses/" style={{ textDecoration: 'none' }}>
            <span style={{ display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.75rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginBottom: '1rem' }}>
              Bible Verses
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

        <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}>

          <div style={{ borderTop: '1px solid #e8dfc8', paddingTop: '1.5rem' }}>
            <p style={{ color: '#6b5c45', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              More on {parentTopic.name}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link
                href={`/bible-verses-about-${slug}/`}
                style={{ padding: '0.4rem 1rem', background: '#2c4270', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}
              >
                ← All {parentTopic.name} verses
              </Link>
              {siblings.slice(0, 4).map(s => (
                <Link
                  key={s.id}
                  href={`/bible-verses-about-${slug}/${topicSlug(s.name)}/`}
                  style={{ padding: '0.4rem 1rem', background: '#f5f0e8', color: '#2c4270', border: '1px solid #e8dfc8', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e8dfc8', paddingTop: '1.5rem' }}>
            <p style={{ color: '#6b5c45', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Explore More
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link href="/bible-verses/" style={{ padding: '0.4rem 1rem', background: '#f5f0e8', color: '#2c4270', border: '1px solid #e8dfc8', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}>
                All Bible Verses
              </Link>
              {RELATED_CATEGORIES.map(cat => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  style={{ padding: '0.4rem 1rem', background: '#f5f0e8', color: '#2c4270', border: '1px solid #e8dfc8', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
