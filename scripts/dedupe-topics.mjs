/**
 * Deduplicates topics table (batch-optimised):
 * - Keeps oldest record per (name, category)
 * - Bulk-updates all articles pointing at duplicates
 * - Bulk-deletes all duplicate topic rows
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAll(table, select = '*', order = []) {
  const batchSize = 1000;
  let all = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(select).range(from, from + batchSize - 1);
    for (const [col, asc] of order) q = q.order(col, { ascending: asc });
    const { data, error } = await q;
    if (error) throw new Error(`fetchAll(${table}): ${error.message}`);
    all = all.concat(data || []);
    if (!data || data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

console.log('Fetching all topics...');
const topics = await fetchAll('topics', '*', [['created_at', true]]);
console.log(`Total topics: ${topics.length}`);

// Group by normalised key — first in list becomes keeper (oldest created_at)
const groups = {};
for (const t of topics) {
  const key = `${(t.name || '').trim().toLowerCase()}|||${t.category}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(t);
}

const dupeGroups = Object.values(groups).filter(g => g.length > 1);
console.log(`Duplicate groups: ${dupeGroups.length}`);

if (dupeGroups.length === 0) {
  console.log('Nothing to do — all clean!');
  process.exit(0);
}

// Build map: dupeId → keeperId
const dupeToKeeper = {};
const allDupeIds = [];
for (const group of dupeGroups) {
  const [keeper, ...dupes] = group;
  for (const d of dupes) {
    dupeToKeeper[d.id] = keeper.id;
    allDupeIds.push(d.id);
  }
}
console.log(`Duplicate rows: ${allDupeIds.length}`);

// Fetch all articles that need reassignment
console.log('Fetching articles...');
const articles = await fetchAll('articles', 'id, topic_id');
const toReassign = articles.filter(a => a.topic_id && dupeToKeeper[a.topic_id]);
console.log(`Articles to reassign: ${toReassign.length}`);

// Group reassignments by keeper so we can do one update per keeper
const byKeeper = {};
for (const a of toReassign) {
  const keeperId = dupeToKeeper[a.topic_id];
  if (!byKeeper[keeperId]) byKeeper[keeperId] = [];
  byKeeper[keeperId].push(a.id);
}

let reassigned = 0;
let reassignErrors = 0;
const keeperIds = Object.keys(byKeeper);
console.log(`Reassignment batches: ${keeperIds.length}`);

for (let i = 0; i < keeperIds.length; i++) {
  const keeperId = keeperIds[i];
  const articleIds = byKeeper[keeperId];
  const { error } = await supabase
    .from('articles')
    .update({ topic_id: keeperId })
    .in('id', articleIds);
  if (error) {
    console.error(`  ✗ batch ${i + 1}: ${error.message}`);
    reassignErrors++;
  } else {
    reassigned += articleIds.length;
  }
  if ((i + 1) % 20 === 0) console.log(`  reassigned ${reassigned} articles so far...`);
}
console.log(`Reassigned ${reassigned} articles (${reassignErrors} errors)`);

// Bulk-delete duplicates in chunks of 400 (URL length limit)
console.log(`Deleting ${allDupeIds.length} duplicate topics...`);
const CHUNK = 400;
let deleted = 0;
let deleteErrors = 0;

for (let i = 0; i < allDupeIds.length; i += CHUNK) {
  const chunk = allDupeIds.slice(i, i + CHUNK);
  const { error } = await supabase.from('topics').delete().in('id', chunk);
  if (error) {
    console.error(`  ✗ delete chunk ${i / CHUNK + 1}: ${error.message}`);
    deleteErrors++;
  } else {
    deleted += chunk.length;
  }
  console.log(`  deleted ${deleted}/${allDupeIds.length}...`);
}

console.log('\n========= DONE =========');
console.log(`Articles reassigned : ${reassigned}`);
console.log(`Topic rows deleted  : ${deleted}`);
console.log(`Errors              : ${reassignErrors + deleteErrors}`);

// Verification
const remaining = await fetchAll('topics', 'id, name, category');
const cats = {};
remaining.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
console.log(`\nRemaining topics (${remaining.length} total):`);
for (const [cat, count] of Object.entries(cats).sort()) {
  console.log(`  ${cat}: ${count}`);
}
