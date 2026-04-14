export const dynamic = 'force-dynamic';

import { supabase } from '../lib/supabase.js';

const SITE_URL = 'https://bibleverseinsights.com';

const KEY_BIBLE_CHAPTERS = [
  ['john', 1], ['john', 3], ['john', 14], ['john', 15],
  ['psalms', 1], ['psalms', 23], ['psalms', 119],
  ['romans', 5], ['romans', 8], ['romans', 12],
  ['matthew', 5], ['matthew', 6], ['matthew', 7],
  ['genesis', 1], ['genesis', 3],
  ['1corinthians', 13], ['1corinthians', 15],
  ['ephesians', 2], ['ephesians', 6],
  ['philippians', 4],
  ['hebrews', 11],
  ['james', 1],
  ['proverbs', 3], ['proverbs', 31],
  ['isaiah', 40], ['isaiah', 53],
];

export default async function sitemap() {
  let articles = [];
  if (supabase) {
    const { data } = await supabase
      .from('articles')
      .select('slug, category, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(2000);
    articles = data || [];
  }

  const staticPages = [
    { url: `${SITE_URL}/`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/topics/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/questions/`,lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/guides/`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/bible/john/1/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const biblePages = KEY_BIBLE_CHAPTERS.map(([book, chapter]) => ({
    url:             `${SITE_URL}/bible/${book}/${chapter}/`,
    lastModified:    new Date(),
    changeFrequency: 'yearly',
    priority:        0.6,
  }));

  const articlePages = articles.map((a) => ({
    url:             `${SITE_URL}/bible-verses/${a.slug}/`,
    lastModified:    new Date(a.created_at || Date.now()),
    changeFrequency: 'monthly',
    priority:        0.85,
  }));

  return [...staticPages, ...biblePages, ...articlePages];
}
