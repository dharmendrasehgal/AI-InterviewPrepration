-- Migration: 0005_expert_sessions
-- Creates expert_sessions for WebRTC live session state tracking

CREATE TABLE IF NOT EXISTS expert_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL UNIQUE REFERENCES bookings(id),
  recording_key TEXT,
  transcript    TEXT,
  consent_at    TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expert_sessions_booking_idx ON expert_sessions(booking_id);
CREATE INDEX IF NOT EXISTS expert_sessions_status_idx ON expert_sessions(status);
