export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { topicSlug } from '../../../../lib/topicSlug.js';
import { ARTICLE_STYLES } from '../../../../lib/articlePage.js';

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
  if (!supabase) return { article: null, parentTopic: null };

  const { data: allParents } = await supabase
    .from('topics')
    .select('id, name')
    .eq('category', 'bible-verses')
    .is('parent_id', null);

  const parentTopic = (allParents || []).find(t => topicSlug(t.name) === parentSlug);
  if (!parentTopic) return { article: null, parentTopic: null };

  const { data: children } = await supabase
    .from('topics')
    .select('id, name')
    .eq('parent_id', parentTopic.id);

  const childTopic = (children || []).find(t => topicSlug(t.name) === childSlug);
  if (!childTopic) return { article: null, parentTopic };

  const { data: articleRows } = await supabase
    .from('articles')
    .select('*')
    .eq('topic_id', childTopic.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);

  return {
    article:     (articleRows || [])[0] || null,
    parentTopic,
    childTopic,
  };
}

export async function generateMetadata({ params }) {
  const { article, childTopic } = await resolveArticle(params.slug, params.child);
  if (!article) return { title: 'Article Not Found' };
  const canonical = `https://bibleverseinsights.com/bible-verses/${params.slug}/${params.child}/`;
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

export default async function BibleVersesChildPage({ params }) {
  const { article, parentTopic, childTopic } = await resolveArticle(params.slug, params.child);

  if (!parentTopic) notFound();
  if (!article)     notFound();

  return (
    <>
      <style suppressHydrationWarning>{ARTICLE_STYLES}</style>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#8b7355', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#b8860b', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/bible-verses" style={{ color: '#b8860b', textDecoration: 'none' }}>Bible Verses</Link>
          <span>›</span>
          <Link href={`/bible-verses/${params.slug}`} style={{ color: '#b8860b', textDecoration: 'none' }}>{parentTopic.name}</Link>
          <span>›</span>
          <span style={{ color: '#8b7355' }}>{article.title}</span>
        </div>

        <article style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 2px 12px rgba(30,45,74,0.06)' }}>

          <Link href="/bible-verses" style={{ textDecoration: 'none' }}>
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

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            href={`/bible-verses/${params.slug}`}
            style={{ backgroundColor: '#f5f0e8', color: '#2c4270', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem', border: '1px solid #e8dfc8' }}
          >
            ← More on {parentTopic.name}
          </Link>
          <Link
            href="/bible-verses"
            style={{ backgroundColor: '#f5f0e8', color: '#2c4270', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', fontWeight: '500', textDecoration: 'none', fontSize: '0.875rem', border: '1px solid #e8dfc8' }}
          >
            ← All Bible Verses
          </Link>
        </div>

      </div>
    </>
  );
}
