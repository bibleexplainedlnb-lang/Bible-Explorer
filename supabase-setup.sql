-- Bible Explorer CMS — Run this in your Supabase SQL Editor

-- 1. Topics table
CREATE TABLE IF NOT EXISTS topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN ('topics', 'guides', 'questions')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. RLS: allow all operations from anon key (admin-only app, no public access needed)
ALTER TABLE topics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_topics"   ON topics   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_articles" ON articles FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed a few starter topics
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
