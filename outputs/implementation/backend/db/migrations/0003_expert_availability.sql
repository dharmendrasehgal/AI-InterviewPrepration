-- Migration: 0003_expert_availability
-- Creates expert_availability for time slot management
-- Requires btree_gist for the overlap exclusion constraint

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS expert_availability (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id  UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  is_booked  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slot_min_50_min CHECK (end_at >= start_at + INTERVAL '50 minutes'),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    expert_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
);

CREATE INDEX IF NOT EXISTS expert_avail_expert_start_idx ON expert_availability(expert_id, start_at);
CREATE INDEX IF NOT EXISTS expert_avail_unbooked_idx ON expert_availability(expert_id, is_booked) WHERE is_booked = FALSE;
