export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { guides } from '../../lib/db.js';
import { createClient } from '@supabase/supabase-js';

export const metadata = { title: 'Study Guides' };

async function fetchSupabaseGuides() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const sb = createClient(url, key);
    const { data } = await sb
      .from('articles')
      .select('slug, title, category, created_at')
      .eq('category', 'guides')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(200);
    return (data || []).map(a => ({ ...a, _source: 'supabase' }));
  } catch { return []; }
}

const GUIDE_ICONS = ['📖', '🕊️', '✝️', '📜', '🙏', '⚓', '💡', '🌿'];

export default async function GuidesPage() {
  const [sqliteGuides, supabaseGuides] = await Promise.all([
    Promise.resolve(guides.list()),
    fetchSupabaseGuides(),
  ]);

  const sqliteSlugs = new Set(sqliteGuides.map(g => g.slug));
  const merged = [
    ...supabaseGuides.filter(g => !sqliteSlugs.has(g.slug)),
    ...sqliteGuides,
  ];

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.75rem' }}>
          Study Guides
        </h1>
        <p style={{ color: '#6b5c45', fontSize: '1rem', lineHeight: 1.7 }}>
          In-depth guides to help you read, understand, and apply the Bible. Whether you are just starting out or looking to go deeper, these guides are for you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {merged.map((guide, i) => {
          const href = guide._source === 'supabase'
            ? `/bible-verses/${guide.slug}/`
            : `/guides/${guide.slug}/`;
          return (
            <Link key={guide.slug} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white', border: '1px solid #e8dfc8',
                borderRadius: '0.875rem', padding: '1.625rem',
                height: '100%', cursor: 'pointer',
              }}>
                <div style={{ color: '#d4a017', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                  {GUIDE_ICONS[i % GUIDE_ICONS.length]}
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.5rem' }}>
                  {guide.title}
                </h2>
                {guide.topic_title && (
                  <span style={{
                    display: 'inline-block', backgroundColor: '#f5f0e8',
                    color: '#8b7355', fontSize: '0.75rem', padding: '0.15rem 0.6rem',
                    borderRadius: '1rem', border: '1px solid #e8dfc8',
                  }}>
                    {guide.topic_title}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        {merged.length === 0 && (
          <p style={{ color: '#8b7355', fontStyle: 'italic' }}>No guides published yet.</p>
        )}
      </div>
    </div>
  );
}
