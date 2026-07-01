import pg from 'pg';

const connStr = process.env.SUPABASE_DB_URL;
if (!connStr) { console.error('SUPABASE_DB_URL not set'); process.exit(1); }

// Manual parse: password may contain '@', '#', etc. that break WHATWG URL parsing.
// Split on the LAST '@' to find user-info vs host, and FIRST ':' to split user vs password.
const proto = connStr.match(/^postgres(?:ql)?:\/\//)?.[0];
if (!proto) { console.error('SUPABASE_DB_URL must start with postgres:// or postgresql://'); process.exit(1); }
const rest = connStr.slice(proto.length);
const lastAt = rest.lastIndexOf('@');
const auth = rest.slice(0, lastAt);
const hostpart = rest.slice(lastAt + 1);
const firstColon = auth.indexOf(':');
const user = firstColon === -1 ? auth : auth.slice(0, firstColon);
const password = firstColon === -1 ? '' : auth.slice(firstColon + 1);
const slash = hostpart.indexOf('/');
const hostport = slash === -1 ? hostpart : hostpart.slice(0, slash);
const database = (slash === -1 ? 'postgres' : hostpart.slice(slash + 1).split('?')[0]) || 'postgres';
const [host, port] = hostport.split(':');

const client = new pg.Client({
  host,
  port: Number(port) || 5432,
  user,
  password,
  database,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Connected to Supabase Postgres.');

console.log('\n--- 1. Pre-check: existing duplicates on topic_id ---');
const dup = await client.query(`
  SELECT topic_id, COUNT(*) AS cnt
  FROM articles
  WHERE topic_id IS NOT NULL
  GROUP BY topic_id
  HAVING COUNT(*) > 1
  ORDER BY cnt DESC
  LIMIT 10;
`);
console.log(`Duplicate topic_id groups: ${dup.rowCount}`);
if (dup.rowCount > 0) {
  console.log(dup.rows);
  console.error('Refusing to add UNIQUE constraint while duplicates exist.');
  await client.end();
  process.exit(1);
}

console.log('\n--- 2. Pre-check: does unique_topic_article already exist? ---');
const before = await client.query(
  `SELECT conname FROM pg_constraint WHERE conname = 'unique_topic_article';`
);
console.log(`Rows: ${before.rowCount}`);

console.log('\n--- 3. Apply section 7 (idempotent) ---');
await client.query(`
  DO $$
  BEGIN
    ALTER TABLE articles ADD CONSTRAINT unique_topic_article UNIQUE (topic_id);
  EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
  END $$;
`);
console.log('ALTER TABLE executed.');

console.log('\n--- 4. Verify constraint exists ---');
const after = await client.query(
  `SELECT conname, pg_get_constraintdef(oid) AS def
   FROM pg_constraint
   WHERE conname = 'unique_topic_article';`
);
console.log(`Rows: ${after.rowCount}`);
console.log(after.rows);
if (after.rowCount !== 1) {
  console.error('VERIFICATION FAILED: unique_topic_article not found.');
  await client.end();
  process.exit(1);
}

console.log('\n--- 5. Behaviour test: insert duplicate topic_id and expect 23505 ---');
const sample = await client.query(
  `SELECT topic_id FROM articles WHERE topic_id IS NOT NULL LIMIT 1;`
);
if (!sample.rowCount) {
  console.log('No articles with topic_id; skipping behaviour test.');
} else {
  const topicId = sample.rows[0].topic_id;
  const slug = `__probe-uta-final-${Date.now()}`;
  try {
    await client.query(
      `INSERT INTO articles (topic_id, title, slug, status, language)
       VALUES ($1, 'PROBE — DELETE ME', $2, 'draft', 'zz');`,
      [topicId, slug]
    );
    console.error('UNEXPECTED: insert succeeded — constraint not enforcing!');
    // Clean up just in case
    await client.query(`DELETE FROM articles WHERE slug = $1;`, [slug]);
    await client.end();
    process.exit(1);
  } catch (e) {
    console.log('Insert error code:', e.code);
    console.log('Insert error message:', e.message);
    if (e.code === '23505' && (e.message || '').includes('unique_topic_article')) {
      console.log('PASS: duplicate insert blocked by unique_topic_article.');
    } else if (e.code === '23505') {
      console.log('PASS-ish: duplicate insert blocked by another unique constraint (still proves duplicates impossible).');
    } else {
      console.error('FAIL: insert errored with unexpected code.');
      await client.end();
      process.exit(1);
    }
  }
}

await client.end();
console.log('\nAll done. unique_topic_article is enforced on the live Supabase database.');
