-- Interview Preparation Platform — Initial Schema
-- Migration: 0001_initial
-- Run via: npm run db:migrate

-- Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash            TEXT NOT NULL UNIQUE,
  email_encrypted       TEXT NOT NULL,
  full_name_encrypted   TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'candidate'
                          CHECK (role IN ('candidate', 'expert', 'admin')),
  password_hash         TEXT,
  email_verify_token    TEXT,
  email_verify_expiry   TIMESTAMPTZ,
  email_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  status                TEXT NOT NULL DEFAULT 'pending_verification'
                          CHECK (status IN ('active', 'suspended', 'pending_verification')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Refresh Tokens ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);

-- ─── Candidate Profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  target_industry     TEXT,
  career_level        TEXT CHECK (career_level IN ('entry', 'mid', 'senior', 'executive')),
  interview_track     TEXT CHECK (interview_track IN ('behavioral', 'technical', 'situational', 'mixed')),
  resume_s3_key       TEXT,
  parsed_resume_json  JSONB,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Questions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('behavioral', 'technical', 'situational', 'role_specific')),
  level       TEXT NOT NULL CHECK (level IN ('entry', 'mid', 'senior', 'executive')),
  industry    TEXT NOT NULL DEFAULT 'general',
  difficulty  INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  tags        JSONB NOT NULL DEFAULT '[]',
  framework   TEXT,
  status      TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS questions_type_idx     ON questions(type);
CREATE INDEX IF NOT EXISTS questions_level_idx    ON questions(level);
CREATE INDEX IF NOT EXISTS questions_industry_idx ON questions(industry);
CREATE INDEX IF NOT EXISTS questions_status_idx   ON questions(status);
-- Full-text search index using pg_trgm
CREATE INDEX IF NOT EXISTS questions_text_trgm_idx ON questions USING gin(text gin_trgm_ops);

-- ─── Question Answers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text  TEXT NOT NULL,
  keywords     JSONB NOT NULL DEFAULT '[]',
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS question_answers_question_id_idx ON question_answers(question_id);

-- ─── Bookmarks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);

-- ─── Mock Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'awaiting_consent'
                      CHECK (status IN ('awaiting_consent', 'in_progress', 'processing', 'scored', 'failed')),
  question_count    INTEGER NOT NULL,
  track             TEXT NOT NULL,
  level             TEXT NOT NULL,
  composite_score   INTEGER,
  avg_wpm           INTEGER,
  total_fillers     INTEGER,
  consent_logged_at TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mock_sessions_user_id_idx ON mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS mock_sessions_status_idx  ON mock_sessions(status);

-- ─── Session Responses ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID NOT NULL REFERENCES mock_sessions(id),
  response_index   INTEGER NOT NULL,
  question_id      UUID NOT NULL REFERENCES questions(id),
  transcript       TEXT,
  duration_seconds INTEGER,
  speech_rate_wpm  INTEGER,
  filler_word_count INTEGER,
  filler_percentage REAL,
  keyword_relevance INTEGER,
  clarity_score    INTEGER,
  improvement_tip  TEXT,
  scored_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS session_responses_session_id_idx ON session_responses(session_id);

-- ─── Migrations tracker ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _migrations (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO _migrations(name) VALUES ('0001_initial') ON CONFLICT (name) DO NOTHING;
