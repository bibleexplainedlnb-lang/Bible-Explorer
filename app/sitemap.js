export const dynamic = 'force-dynamic';

import { supabase } from '../lib/supabase.js';

const SITE_URL = 'https://bibleverseinsights.com';

export default async function sitemap() {
  if (!supabase) return [];

  const { data } = await supabase
    .from('articles')
    .select('slug, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5000);

  const articles = data || [];

  return articles.map((a) => ({
    url:             `${SITE_URL}/bible-verses/${a.slug}/`,
    lastModified:    new Date(a.created_at || Date.now()),
    changeFrequency: 'monthly',
    priority:        0.85,
  }));
}
