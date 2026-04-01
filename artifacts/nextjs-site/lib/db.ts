/**
 * SQLite database layer — better-sqlite3 (synchronous, server-only)
 *
 * Provides typed CRUD helpers for:
 *   questions · topics · guides · bible_notes
 *
 * The DB file lives at  <project-root>/data/content.db
 * Usage (server components / Route Handlers only):
 *   import { db, questions, topics, guides, bibleNotes } from "@/lib/db";
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
  topic: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;
export type QuestionPatch = Partial<QuestionInput>;

export interface Topic {
  id: number;
  name: string;
  slug: string;
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
  createdAt: string;
  updatedAt: string;
}

export type GuideInput = Omit<Guide, "id" | "createdAt" | "updatedAt">;
export type GuidePatch = Partial<GuideInput>;

export interface BibleNote {
  id: number;
  reference: string; // e.g. "John 3:16"
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export type BibleNoteInput = Omit<BibleNote, "id" | "createdAt" | "updatedAt">;
export type BibleNotePatch = Partial<BibleNoteInput>;

/* ─── Connection singleton ───────────────────────────────────────────────── */

declare global {
  // Persist across HMR reloads in development
  // eslint-disable-next-line no-var
  var __sqlite_db: Database.Database | undefined;
}

function openDb(): Database.Database {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "content.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");    // Better concurrent read performance
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
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    slug      TEXT    NOT NULL UNIQUE,
    createdAt TEXT    NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guides (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    title            TEXT    NOT NULL,
    slug             TEXT    NOT NULL UNIQUE,
    shortDescription TEXT    NOT NULL DEFAULT '',
    content          TEXT    NOT NULL DEFAULT '',
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

/* ─── CRUD helpers ───────────────────────────────────────────────────────── */

function now() {
  return new Date().toISOString();
}

/* ── Questions ─────────────────────────────────────────────────────────── */

export const questions = {
  /** Return all questions, newest first */
  list(): Question[] {
    return db
      .prepare("SELECT * FROM questions ORDER BY createdAt DESC")
      .all() as Question[];
  },

  /** Find by primary key — returns undefined if not found */
  findById(id: number): Question | undefined {
    return db
      .prepare("SELECT * FROM questions WHERE id = ?")
      .get(id) as Question | undefined;
  },

  /** Find by slug */
  findBySlug(slug: string): Question | undefined {
    return db
      .prepare("SELECT * FROM questions WHERE slug = ?")
      .get(slug) as Question | undefined;
  },

  /** Filter by topic slug/name */
  listByTopic(topic: string): Question[] {
    return db
      .prepare("SELECT * FROM questions WHERE topic = ? ORDER BY createdAt DESC")
      .all(topic) as Question[];
  },

  /** Insert a new question — returns the created row */
  create(input: QuestionInput): Question {
    const ts = now();
    const stmt = db.prepare(/* sql */ `
      INSERT INTO questions (title, slug, shortAnswer, content, topic, createdAt, updatedAt)
      VALUES (@title, @slug, @shortAnswer, @content, @topic, @createdAt, @updatedAt)
    `);
    const result = stmt.run({ ...input, createdAt: ts, updatedAt: ts });
    return questions.findById(result.lastInsertRowid as number)!;
  },

  /** Update one or more fields — returns the updated row */
  update(id: number, patch: QuestionPatch): Question | undefined {
    const existing = questions.findById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE questions
      SET title = @title, slug = @slug, shortAnswer = @shortAnswer,
          content = @content, topic = @topic, updatedAt = @updatedAt
      WHERE id = @id
    `).run({ ...merged, id });

    return questions.findById(id);
  },

  /** Delete by id — returns true if a row was removed */
  delete(id: number): boolean {
    const result = db.prepare("DELETE FROM questions WHERE id = ?").run(id);
    return result.changes > 0;
  },
};

/* ── Topics ────────────────────────────────────────────────────────────── */

export const topics = {
  list(): Topic[] {
    return db
      .prepare("SELECT * FROM topics ORDER BY name ASC")
      .all() as Topic[];
  },

  findById(id: number): Topic | undefined {
    return db
      .prepare("SELECT * FROM topics WHERE id = ?")
      .get(id) as Topic | undefined;
  },

  findBySlug(slug: string): Topic | undefined {
    return db
      .prepare("SELECT * FROM topics WHERE slug = ?")
      .get(slug) as Topic | undefined;
  },

  create(input: TopicInput): Topic {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO topics (name, slug, createdAt, updatedAt)
      VALUES (@name, @slug, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return topics.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, patch: TopicPatch): Topic | undefined {
    const existing = topics.findById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE topics SET name = @name, slug = @slug, updatedAt = @updatedAt WHERE id = @id
    `).run({ ...merged, id });

    return topics.findById(id);
  },

  delete(id: number): boolean {
    return db.prepare("DELETE FROM topics WHERE id = ?").run(id).changes > 0;
  },
};

/* ── Guides ────────────────────────────────────────────────────────────── */

export const guides = {
  list(): Guide[] {
    return db
      .prepare("SELECT * FROM guides ORDER BY createdAt DESC")
      .all() as Guide[];
  },

  findById(id: number): Guide | undefined {
    return db
      .prepare("SELECT * FROM guides WHERE id = ?")
      .get(id) as Guide | undefined;
  },

  findBySlug(slug: string): Guide | undefined {
    return db
      .prepare("SELECT * FROM guides WHERE slug = ?")
      .get(slug) as Guide | undefined;
  },

  create(input: GuideInput): Guide {
    const ts = now();
    const result = db.prepare(/* sql */ `
      INSERT INTO guides (title, slug, shortDescription, content, createdAt, updatedAt)
      VALUES (@title, @slug, @shortDescription, @content, @createdAt, @updatedAt)
    `).run({ ...input, createdAt: ts, updatedAt: ts });
    return guides.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, patch: GuidePatch): Guide | undefined {
    const existing = guides.findById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...patch, updatedAt: now() };
    db.prepare(/* sql */ `
      UPDATE guides
      SET title = @title, slug = @slug, shortDescription = @shortDescription,
          content = @content, updatedAt = @updatedAt
      WHERE id = @id
    `).run({ ...merged, id });

    return guides.findById(id);
  },

  delete(id: number): boolean {
    return db.prepare("DELETE FROM guides WHERE id = ?").run(id).changes > 0;
  },
};

/* ── Bible Notes ───────────────────────────────────────────────────────── */

export const bibleNotes = {
  list(): BibleNote[] {
    return db
      .prepare("SELECT * FROM bible_notes ORDER BY reference ASC")
      .all() as BibleNote[];
  },

  findById(id: number): BibleNote | undefined {
    return db
      .prepare("SELECT * FROM bible_notes WHERE id = ?")
      .get(id) as BibleNote | undefined;
  },

  /** Look up by Bible reference string, e.g. "John 3:16" */
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

  /** Upsert: insert if reference doesn't exist, update if it does */
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
      SET reference = @reference, explanation = @explanation, updatedAt = @updatedAt
      WHERE id = @id
    `).run({ ...merged, id });

    return bibleNotes.findById(id);
  },

  delete(id: number): boolean {
    return db.prepare("DELETE FROM bible_notes WHERE id = ?").run(id).changes > 0;
  },
};
