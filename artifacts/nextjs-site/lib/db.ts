/**
 * SQLite database layer — better-sqlite3 (synchronous, server-only)
 *
 * Tables: questions · topics · guides · bible_notes
 * DB file: <project-root>/data/content.db  (auto-created on first import)
 *
 * Usage (server components / Route Handlers only):
 *   import { questions, topics, guides, bibleNotes, ensureSeeded } from "@/lib/db";
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface Question {
  id: number;
  title: string;
  slug: string;
  shortAnswer: string;
  content: string;
  topic: string;          // topic name, e.g. "Salvation"
  createdAt: string;
  updatedAt: string;
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;
export type QuestionPatch = Partial<QuestionInput>;

export interface Topic {
  id: number;
  name: string;
  slug: string;
  questionSlugs: string;  // JSON array, e.g. '["what-is-salvation"]'
  createdAt: string;
  updatedAt: string;
}

export type TopicInput = Omit<Topic, "id" | "createdAt" | "updatedAt">;
export type TopicPatch = Partial<TopicInput>;

export interface Guide {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  relatedQuestions: string;  // JSON array of slugs
  relatedTopics: string;     // JSON array of slugs
  createdAt: string;
  updatedAt: string;
}

export type GuideInput = Omit<Guide, "id" | "createdAt" | "updatedAt">;
export type GuidePatch = Partial<GuideInput>;

export interface BibleNote {
  id: number;
  reference: string;
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export type BibleNoteInput = Omit<BibleNote, "id" | "createdAt" | "updatedAt">;
export type BibleNotePatch = Partial<BibleNoteInput>;

/* ─── Connection singleton ───────────────────────────────────────────────── */

declare global {
  // eslint-disable-next-line no-var
  var __sqlite_db: Database.Database | undefined;
}

function openDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, "content.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db: Database.Database =
  globalThis.__sqlite_db ?? (globalThis.__sqlite_db = openDb());

/* ─── Schema bootstrap ───────────────────────────────────────────────────── */

db.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    slug        TEXT    NOT NULL UNIQUE,
    shortAnswer TEXT    NOT NULL DEFAULT '',
    content     TEXT    NOT NULL DEFAULT '',
    topic       TEXT    NOT NULL DEFAULT '',
    createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS topics (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    slug          TEXT    NOT NULL UNIQUE,
    questionSlugs TEXT    NOT NULL DEFAULT '[]',
    createdAt     TEXT    NOT NULL DEFAULT (datetime('now')),
    updatedAt     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guides (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT    NOT NULL,
    slug             TEXT    NOT NULL UNIQUE,
    shortDescription TEXT    NOT NULL DEFAULT '',
    content          TEXT    NOT NULL DEFAULT '',
    relatedQuestions TEXT    NOT NULL DEFAULT '[]',
    relatedTopics    TEXT    NOT NULL DEFAULT '[]',
    createdAt        TEXT    NOT NULL DEFAULT (datetime('now')),
    updatedAt        TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bible_notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    reference   TEXT    NOT NULL UNIQUE,
    explanation TEXT    NOT NULL DEFAULT '',
    createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
    updatedAt   TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add columns that may be missing on existing databases (idempotent)
try { db.exec("ALTER TABLE topics ADD COLUMN questionSlugs TEXT NOT NULL DEFAULT '[]'"); } catch {}
try { db.exec("ALTER TABLE guides ADD COLUMN relatedQuestions TEXT NOT NULL DEFAULT '[]'"); } catch {}
try { db.exec("ALTER TABLE guides ADD COLUMN relatedTopics TEXT NOT NULL DEFAULT '[]'"); } catch {}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function now() { return new Date().toISOString(); }

/** Parse a stored JSON array column safely */
export function parseJsonArray(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

/* ─── CRUD — Questions ───────────────────────────────────────────────────── */

export const questions = {
  list(): Question[] {
    return db.prepare("SELECT * FROM questions ORDER BY createdAt DESC").all() as Question[];
  },
  findById(id: number): Question | undefined {
    return db.prepare("SELECT * FROM questions WHERE id = ?").get(id) as Question | undefined;
  },
  findBySlug(slug: string): Question | undefined {
    return db.prepare("SELECT * FROM questions WHERE slug = ?").get(slug) as Question | undefined;
  },
  listByTopic(topicName: string): Question[] {
    return db
      .prepare("SELECT * FROM questions WHERE topic = ? ORDER BY createdAt DESC")
      .all(topicName) as Question[];
  },
  /** Return questions matching a list of slugs, preserving order */
  listBySlugs(slugs: string[]): Question[] {
    if (slugs.length === 0) return [];
    const placeholders = slugs.map(() => "?").join(",");
    const rows = db
      .prepare(`SELECT * FROM questions WHERE slug IN (${placeholders})`)
      .all(...slugs) as Question[];
    const map = new Map(rows.map((r) => [r.slug, r]));
    return slugs.map((s) => map.get(s)).filter((r): r is Question => r !== undefined);
  },
  create(input: QuestionInput): Question {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO questions (title, slug, shortAnswer, content, topic, createdAt, updatedAt)
      VALUES (@title, @slug, @shortAnswer, @content, @topic, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return questions.findById(result.lastInsertRowid as number)!;
  },
  update(id: number, patch: QuestionPatch): Question | undefined {
    const existing = questions.findById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE questions
      SET title=@title, slug=@slug, shortAnswer=@shortAnswer, content=@content,
          topic=@topic, updatedAt=@updatedAt
      WHERE id=@id
    `).run({ ...merged, id });
    return questions.findById(id);
  },
  delete(id: number): boolean {
    return db.prepare("DELETE FROM questions WHERE id = ?").run(id).changes > 0;
  },
};

/* ─── CRUD — Topics ──────────────────────────────────────────────────────── */

export const topics = {
  list(): Topic[] {
    return db.prepare("SELECT * FROM topics ORDER BY name ASC").all() as Topic[];
  },
  findById(id: number): Topic | undefined {
    return db.prepare("SELECT * FROM topics WHERE id = ?").get(id) as Topic | undefined;
  },
  findBySlug(slug: string): Topic | undefined {
    return db.prepare("SELECT * FROM topics WHERE slug = ?").get(slug) as Topic | undefined;
  },
  findByName(name: string): Topic | undefined {
    return db
      .prepare("SELECT * FROM topics WHERE lower(name) = lower(?)")
      .get(name) as Topic | undefined;
  },
  create(input: TopicInput): Topic {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO topics (name, slug, questionSlugs, createdAt, updatedAt)
      VALUES (@name, @slug, @questionSlugs, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return topics.findById(result.lastInsertRowid as number)!;
  },
  update(id: number, patch: TopicPatch): Topic | undefined {
    const existing = topics.findById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE topics SET name=@name, slug=@slug, questionSlugs=@questionSlugs,
             updatedAt=@updatedAt WHERE id=@id
    `).run({ ...merged, id });
    return topics.findById(id);
  },
  delete(id: number): boolean {
    return db.prepare("DELETE FROM topics WHERE id = ?").run(id).changes > 0;
  },
};

/* ─── CRUD — Guides ──────────────────────────────────────────────────────── */

export const guides = {
  list(): Guide[] {
    return db.prepare("SELECT * FROM guides ORDER BY createdAt DESC").all() as Guide[];
  },
  findById(id: number): Guide | undefined {
    return db.prepare("SELECT * FROM guides WHERE id = ?").get(id) as Guide | undefined;
  },
  findBySlug(slug: string): Guide | undefined {
    return db.prepare("SELECT * FROM guides WHERE slug = ?").get(slug) as Guide | undefined;
  },
  /** Find the first guide that lists this question slug in relatedQuestions */
  findByRelatedQuestion(questionSlug: string): Guide | undefined {
    return db.prepare(/* sql */ `
      SELECT * FROM guides
      WHERE EXISTS (
        SELECT 1 FROM json_each(relatedQuestions) WHERE value = ?
      )
      LIMIT 1
    `).get(questionSlug) as Guide | undefined;
  },
  /** Find guides that list this topic slug in relatedTopics */
  findByRelatedTopic(topicSlug: string): Guide | undefined {
    return db.prepare(/* sql */ `
      SELECT * FROM guides
      WHERE EXISTS (
        SELECT 1 FROM json_each(relatedTopics) WHERE value = ?
      )
      LIMIT 1
    `).get(topicSlug) as Guide | undefined;
  },
  create(input: GuideInput): Guide {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO guides (title, slug, shortDescription, content,
                          relatedQuestions, relatedTopics, createdAt, updatedAt)
      VALUES (@title, @slug, @shortDescription, @content,
              @relatedQuestions, @relatedTopics, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return guides.findById(result.lastInsertRowid as number)!;
  },
  update(id: number, patch: GuidePatch): Guide | undefined {
    const existing = guides.findById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE guides
      SET title=@title, slug=@slug, shortDescription=@shortDescription, content=@content,
          relatedQuestions=@relatedQuestions, relatedTopics=@relatedTopics, updatedAt=@updatedAt
      WHERE id=@id
    `).run({ ...merged, id });
    return guides.findById(id);
  },
  delete(id: number): boolean {
    return db.prepare("DELETE FROM guides WHERE id = ?").run(id).changes > 0;
  },
};

/* ─── CRUD — Bible Notes ─────────────────────────────────────────────────── */

export const bibleNotes = {
  list(): BibleNote[] {
    return db.prepare("SELECT * FROM bible_notes ORDER BY reference ASC").all() as BibleNote[];
  },
  findById(id: number): BibleNote | undefined {
    return db.prepare("SELECT * FROM bible_notes WHERE id = ?").get(id) as BibleNote | undefined;
  },
  findByReference(reference: string): BibleNote | undefined {
    return db
      .prepare("SELECT * FROM bible_notes WHERE reference = ?")
      .get(reference) as BibleNote | undefined;
  },
  create(input: BibleNoteInput): BibleNote {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO bible_notes (reference, explanation, createdAt, updatedAt)
      VALUES (@reference, @explanation, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return bibleNotes.findById(result.lastInsertRowid as number)!;
  },
  upsert(input: BibleNoteInput): BibleNote {
    const existing = bibleNotes.findByReference(input.reference);
    if (existing) return bibleNotes.update(existing.id, { explanation: input.explanation })!;
    return bibleNotes.create(input);
  },
  update(id: number, patch: BibleNotePatch): BibleNote | undefined {
    const existing = bibleNotes.findById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE bible_notes
      SET reference=@reference, explanation=@explanation, updatedAt=@updatedAt WHERE id=@id
    `).run({ ...merged, id });
    return bibleNotes.findById(id);
  },
  delete(id: number): boolean {
    return db.prepare("DELETE FROM bible_notes WHERE id = ?").run(id).changes > 0;
  },
};

/* ─── Seed from content.json ─────────────────────────────────────────────── */

/**
 * One-time seed from data/content.json.
 * Only runs when the questions table is empty — safe to call on every request.
 */
export function ensureSeeded(): void {
  const count = (db.prepare("SELECT COUNT(*) as n FROM questions").get() as { n: number }).n;
  if (count > 0) return;

  // Dynamic require so this file can still be imported in environments that
  // don't have content.json (e.g., test environments with an empty DB).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require("../data/content.json") as {
    questions: Array<{
      slug: string; title: string; shortAnswer: string;
      content?: string; topic: string;
    }>;
    topics: Array<{ slug: string; name: string; questions?: string[] }>;
    guides: Array<{
      slug: string; title: string; shortDescription: string;
      content: string; relatedQuestions?: string[]; relatedTopics?: string[];
    }>;
  };

  const seedAll = db.transaction(() => {
    for (const q of data.questions) {
      db.prepare(/* sql */ `
        INSERT OR IGNORE INTO questions (title, slug, shortAnswer, content, topic)
        VALUES (@title, @slug, @shortAnswer, @content, @topic)
      `).run({
        title: q.title,
        slug: q.slug,
        shortAnswer: q.shortAnswer ?? "",
        content: q.content ?? "",
        topic: q.topic ?? "",
      });
    }

    for (const t of data.topics) {
      db.prepare(/* sql */ `
        INSERT OR IGNORE INTO topics (name, slug, questionSlugs)
        VALUES (@name, @slug, @questionSlugs)
      `).run({
        name: t.name,
        slug: t.slug,
        questionSlugs: JSON.stringify(t.questions ?? []),
      });
    }

    for (const g of data.guides) {
      db.prepare(/* sql */ `
        INSERT OR IGNORE INTO guides
          (title, slug, shortDescription, content, relatedQuestions, relatedTopics)
        VALUES
          (@title, @slug, @shortDescription, @content, @relatedQuestions, @relatedTopics)
      `).run({
        title: g.title,
        slug: g.slug,
        shortDescription: g.shortDescription ?? "",
        content: g.content ?? "",
        relatedQuestions: JSON.stringify(g.relatedQuestions ?? []),
        relatedTopics: JSON.stringify(g.relatedTopics ?? []),
      });
    }
  });

  seedAll();
}

// Auto-seed on first import (no-op if DB already has data)
ensureSeeded();
