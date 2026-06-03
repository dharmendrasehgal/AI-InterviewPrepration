-- Migration: 0006_rubric_evaluations
-- Creates rubric_evaluations for expert competency scoring post-session
-- overall_score is computed at the application layer (Drizzle has no GENERATED AS support)

CREATE TABLE IF NOT EXISTS rubric_evaluations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_session_id   UUID NOT NULL UNIQUE REFERENCES expert_sessions(id),
  expert_id           UUID NOT NULL REFERENCES experts(id),
  communication       SMALLINT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  technical_depth     SMALLINT NOT NULL CHECK (technical_depth BETWEEN 1 AND 5),
  structured_thinking SMALLINT NOT NULL CHECK (structured_thinking BETWEEN 1 AND 5),
  confidence          SMALLINT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
  notes_encrypted     TEXT,
  feedback_text       TEXT NOT NULL,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rubric_session_idx ON rubric_evaluations(expert_session_id);
CREATE INDEX IF NOT EXISTS rubric_expert_idx ON rubric_evaluations(expert_id);
