export const dynamic = 'force-dynamic';

import { notFound, permanentRedirect } from 'next/navigation';
import { getNoStoreSupabase, articleUrl } from '../../../lib/articlePage.js';

export default async function BibleVersesRedirect({ params }) {
  const supabase = getNoStoreSupabase();

  if (supabase) {
    const { data: article } = await supabase
      .from('articles')
      .select('slug, status, topics(category)')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single();

    if (article) {
      permanentRedirect(articleUrl(params.slug, article.topics?.category));
    }

    // Check slug_redirects for renamed slugs
    try {
      const { data: redirect } = await supabase
        .from('slug_redirects')
        .select('new_slug')
        .eq('old_slug', params.slug)
        .single();

      if (redirect?.new_slug) {
        const { data: newArticle } = await supabase
          .from('articles')
          .select('slug, topics(category)')
          .eq('slug', redirect.new_slug)
          .single();
        permanentRedirect(articleUrl(redirect.new_slug, newArticle?.topics?.category));
      }
    } catch { }
  }

  notFound();
}
