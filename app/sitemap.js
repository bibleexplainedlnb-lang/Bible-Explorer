export const dynamic = 'force-dynamic';

import { getNoStoreSupabase, articleUrl } from '../lib/articlePage.js';

const SITE_URL = 'https://bibleverseinsights.com';

export default async function sitemap() {
  const supabase = getNoStoreSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('articles')
    .select('slug, created_at, topics(category)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5000);

  const articles = data || [];

  return articles.map((a) => ({
    url:             `${SITE_URL}${articleUrl(a.slug, a.topics?.category)}`,
    lastModified:    new Date(a.created_at || Date.now()),
    changeFrequency: 'monthly',
    priority:        0.85,
  }));
}
