-- Migration: 0004_bookings
-- Creates bookings table linking candidates to expert availability slots

CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id     UUID NOT NULL REFERENCES users(id),
  expert_id        UUID NOT NULL REFERENCES experts(id),
  availability_id  UUID NOT NULL UNIQUE REFERENCES expert_availability(id),
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  cancelled_by     UUID REFERENCES users(id),
  cancel_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_candidate_idx ON bookings(candidate_id);
CREATE INDEX IF NOT EXISTS bookings_expert_idx ON bookings(expert_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
