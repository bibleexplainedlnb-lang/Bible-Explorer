-- Bible Explorer CMS — Run this in your Supabase SQL Editor
-- Safe to run multiple times (CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- 1. Topics table
CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  is_pillar       BOOLEAN NOT NULL DEFAULT false,
  article_created BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. Add columns for existing tables
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_pillar       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS article_created BOOLEAN NOT NULL DEFAULT false;

-- 1c. Update category CHECK constraint to include all 5 categories
DO $$
BEGIN
  ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_check;
  ALTER TABLE topics ADD CONSTRAINT topics_category_check
    CHECK (category IN ('topics', 'guides', 'questions', 'bible-verses', 'bible-characters'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Articles table
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id         UUID REFERENCES topics(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  keywords         TEXT[],
  related_slugs    TEXT[],
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected')),
  category         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Migration: add any columns missing from earlier versions
ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_title       TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS keywords         TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_slugs    TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS category         TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS topic_id         UUID;

-- 2c. Fix status constraint to allow 'rejected'
DO $$
BEGIN
  ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;
  ALTER TABLE articles ADD CONSTRAINT articles_status_check
    CHECK (status IN ('draft', 'published', 'rejected'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS: allow all operations from anon key
ALTER TABLE topics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_topics"   ON topics;
DROP POLICY IF EXISTS "allow_all_articles" ON articles;
CREATE POLICY "allow_all_topics"   ON topics   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_articles" ON articles FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed starter topics (3 original categories)
INSERT INTO topics (name, category) VALUES
  ('Faith',          'questions'),
  ('Prayer',         'questions'),
  ('Grace',          'questions'),
  ('Forgiveness',    'questions'),
  ('Salvation',      'questions'),
  ('Holy Spirit',    'questions'),
  ('Love',           'questions'),
  ('How to Pray',    'guides'),
  ('Bible Reading',  'guides'),
  ('Christian Life', 'guides')
ON CONFLICT DO NOTHING;
