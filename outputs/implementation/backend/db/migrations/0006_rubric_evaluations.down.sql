-- Rollback: 0006_rubric_evaluations
DROP INDEX IF EXISTS rubric_expert_idx;
DROP INDEX IF EXISTS rubric_session_idx;
DROP TABLE IF EXISTS rubric_evaluations;
