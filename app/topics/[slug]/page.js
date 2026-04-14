export const dynamic = 'force-dynamic';

import { notFound, permanentRedirect } from 'next/navigation';
import { supabase } from '../../../lib/supabase.js';

export async function generateMetadata({ params }) {
  if (!supabase) return { title: 'Not Found' };
  const { data } = await supabase
    .from('articles')
    .select('title, meta_title, meta_description, slug')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();
  if (!data) return { title: 'Not Found' };
  return {
    title: data.meta_title || data.title,
    description: data.meta_description || undefined,
    alternates: { canonical: `/bible-verses/${params.slug}/` },
  };
}

export default async function TopicPage({ params }) {
  if (!supabase) notFound();

  const { data: article } = await supabase
    .from('articles')
    .select('slug, status')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!article) notFound();

  permanentRedirect(`/bible-verses/${params.slug}/`);
}
