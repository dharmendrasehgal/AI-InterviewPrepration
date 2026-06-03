-- Migration: 0002_experts
-- Creates the experts table for Phase 2 Expert Marketplace

CREATE TABLE IF NOT EXISTS experts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio_encrypted TEXT NOT NULL,
  headline     TEXT NOT NULL,
  industry     TEXT NOT NULL CHECK (industry IN ('general_career', 'software_engineering', 'medical')),
  track        TEXT NOT NULL CHECK (track IN ('general_career', 'software_engineering', 'medical')),
  years_exp    SMALLINT NOT NULL CHECK (years_exp BETWEEN 1 AND 50),
  rate_cents   INTEGER NOT NULL DEFAULT 0 CHECK (rate_cents >= 0),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'suspended')),
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experts_status_track_idx ON experts(status, track);
CREATE INDEX IF NOT EXISTS experts_user_id_idx ON experts(user_id);
