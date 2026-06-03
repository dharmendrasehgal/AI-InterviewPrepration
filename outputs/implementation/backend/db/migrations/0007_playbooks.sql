-- Migration: 0007_playbooks
-- Creates playbooks table for structured career preparation guides

CREATE TABLE IF NOT EXISTS playbooks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track      TEXT NOT NULL UNIQUE
               CHECK (track IN ('general_career', 'software_engineering', 'medical')),
  title      TEXT NOT NULL,
  content    JSONB NOT NULL DEFAULT '{"sections":[]}',
  version    INTEGER NOT NULL DEFAULT 1,
  published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS playbooks_published_idx ON playbooks(published);
