import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const DB_PATH = path.join(process.cwd(), 'data', 'content.db');

function getDb() {
  if (globalThis.__sqlite_db) return globalThis.__sqlite_db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT,
      topic_id INTEGER REFERENCES topics(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bible_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      overview TEXT,
      context TEXT,
      application TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(book, chapter)
    );

    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY,
      reference TEXT NOT NULL,
      text TEXT NOT NULL,
      explanation TEXT,
      topic_id INTEGER REFERENCES topics(id)
    );
  `);

  seedIfEmpty(db);
  seedVersesIfEmpty(db);

  globalThis.__sqlite_db = db;
  return db;
}

function seedIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM topics').get().c;
  if (count > 0) return;

  const contentPath = path.join(process.cwd(), 'data', 'content.json');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));

  const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (id, title, slug, description) VALUES (?, ?, ?, ?)');
  const insertQuestion = db.prepare('INSERT OR IGNORE INTO questions (id, title, slug, content, topic_id) VALUES (?, ?, ?, ?, ?)');
  const insertGuide = db.prepare('INSERT OR IGNORE INTO guides (id, title, slug, content) VALUES (?, ?, ?, ?)');
  const insertNote = db.prepare(`
    INSERT OR IGNORE INTO bible_notes (book, chapter, overview, context, application)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    for (const t of content.topics) {
      insertTopic.run(t.id, t.title, t.slug, t.description);
    }
    for (const q of content.questions) {
      insertQuestion.run(q.id, q.title, q.slug, q.content, q.topicId || null);
    }
    for (const g of content.guides) {
      insertGuide.run(g.id, g.title, g.slug, g.content);
    }
    for (const b of content.bibleExplanations) {
      insertNote.run(b.book, b.chapter, b.overview, b.context, b.application);
    }
  });

  seedAll();
}

function seedVersesIfEmpty(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM verses').get().c;
  if (count > 0) return;

  const firstTopic = db.prepare('SELECT id FROM topics ORDER BY id LIMIT 1').get();
  if (!firstTopic) return;

  const insert = db.prepare(
    'INSERT OR IGNORE INTO verses (reference, text, explanation, topic_id) VALUES (?, ?, ?, ?)'
  );

  const seed = db.transaction(() => {
    insert.run(
      'John 3:16',
      'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      'The most quoted verse in the Bible, summarising the gospel message of salvation through faith in Christ.',
      firstTopic.id
    );
    insert.run(
      'Romans 8:28',
      'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
      'A promise of God\'s sovereignty, assuring believers that every circumstance — even suffering — serves His redemptive plan.',
      firstTopic.id
    );
  });

  seed();
}

export const topics = {
  list: () => getDb().prepare('SELECT * FROM topics ORDER BY title').all(),
  findBySlug: (slug) => getDb().prepare('SELECT * FROM topics WHERE slug = ?').get(slug),
  create: (data) => getDb().prepare('INSERT INTO topics (title, slug, description) VALUES (?, ?, ?)').run(data.title, data.slug, data.description),
};

export const questions = {
  list: () => getDb().prepare(`
    SELECT q.*, t.title as topic_title, t.slug as topic_slug
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    ORDER BY q.title
  `).all(),
  findBySlug: (slug) => getDb().prepare(`
    SELECT q.*, t.title as topic_title, t.slug as topic_slug
    FROM questions q
    LEFT JOIN topics t ON q.topic_id = t.id
    WHERE q.slug = ?
  `).get(slug),
  listByTopic: (topicId) => getDb().prepare('SELECT * FROM questions WHERE topic_id = ? ORDER BY title').all(topicId),
  create: (data) => getDb().prepare('INSERT INTO questions (title, slug, content, topic_id) VALUES (?, ?, ?, ?)').run(data.title, data.slug, data.content, data.topicId || null),
};

export const guides = {
  list: () => getDb().prepare('SELECT * FROM guides ORDER BY title').all(),
  findBySlug: (slug) => getDb().prepare('SELECT * FROM guides WHERE slug = ?').get(slug),
  create: (data) => getDb().prepare('INSERT INTO guides (title, slug, content) VALUES (?, ?, ?)').run(data.title, data.slug, data.content),
};

export const bibleNotes = {
  findByReference: (book, chapter) => getDb().prepare('SELECT * FROM bible_notes WHERE book = ? AND chapter = ?').get(book, chapter),
  upsert: (data) => getDb().prepare(`
    INSERT INTO bible_notes (book, chapter, overview, context, application)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(book, chapter) DO UPDATE SET
      overview = excluded.overview,
      context = excluded.context,
      application = excluded.application
  `).run(data.book, data.chapter, data.overview, data.context, data.application),
};

export const verses = {
  listByTopic(topicId) {
    const db = getDb();
    return db.prepare('SELECT * FROM verses WHERE topic_id = ?').all(topicId);
  },
};
