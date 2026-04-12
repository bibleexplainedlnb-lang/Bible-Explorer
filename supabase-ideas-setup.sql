-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_ideas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  topic_id   UUID,
  category   TEXT,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns if the table was created without them
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS topic_id  UUID;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS category  TEXT;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS used      BOOLEAN NOT NULL DEFAULT false;

-- 3. Add foreign key constraint if topics table exists (skip errors if already set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'content_ideas'
      AND constraint_name = 'content_ideas_topic_id_fkey'
  ) THEN
    ALTER TABLE content_ideas
      ADD CONSTRAINT content_ideas_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Unique index to prevent duplicate titles per topic
CREATE UNIQUE INDEX IF NOT EXISTS content_ideas_title_topic_unique
  ON content_ideas (topic_id, title);

-- 5. RLS: allow all operations from anon key
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_content_ideas" ON content_ideas;
CREATE POLICY "allow_all_content_ideas" ON content_ideas
  FOR ALL USING (true) WITH CHECK (true);
