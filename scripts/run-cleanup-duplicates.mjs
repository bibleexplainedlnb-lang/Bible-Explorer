import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const STATUS_RANK = { published: 0, draft: 1, rejected: 2 };

let all = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, status, topic_id, created_at')
    .not('topic_id', 'is', null)
    .order('created_at', { ascending: false })
    .range(from, from + 999);
  if (error) { console.error('fetch error:', error); process.exit(1); }
  if (!data?.length) break;
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

const byTopic = {};
for (const a of all) {
  if (!byTopic[a.topic_id]) byTopic[a.topic_id] = [];
  byTopic[a.topic_id].push(a);
}

const toDelete = [];
const dupGroups = [];
for (const [topicId, arts] of Object.entries(byTopic)) {
  if (arts.length <= 1) continue;
  arts.sort((a, b) => {
    const sr = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    if (sr !== 0) return sr;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  dupGroups.push({ topicId, kept: arts[0], removed: arts.slice(1).map(a => ({ id: a.id, status: a.status, slug: a.slug })) });
  for (const dup of arts.slice(1)) {
    if (dup.status !== 'published') toDelete.push(dup.id);
  }
}

console.log(`Scanned: ${all.length}`);
console.log(`Duplicate groups: ${dupGroups.length}`);
console.log(`To delete: ${toDelete.length}`);
if (dupGroups.length) console.log('Sample groups:', JSON.stringify(dupGroups.slice(0, 5), null, 2));

if (!toDelete.length) {
  console.log('No duplicates to delete.');
  process.exit(0);
}

let deleted = 0;
const errors = [];
for (let i = 0; i < toDelete.length; i += 100) {
  const batch = toDelete.slice(i, i + 100);
  const { data: deletedRows, error } = await supabase
    .from('articles').delete().in('id', batch).select('id');
  if (error) errors.push(error.message);
  else deleted += deletedRows?.length ?? 0;
}

console.log(`Deleted: ${deleted}`);
console.log(`Blocked (likely RLS or published): ${toDelete.length - deleted - errors.length}`);
if (errors.length) console.log('Errors:', errors);
