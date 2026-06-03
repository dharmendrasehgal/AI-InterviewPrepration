-- Rollback: 0005_expert_sessions
DROP INDEX IF EXISTS expert_sessions_status_idx;
DROP INDEX IF EXISTS expert_sessions_booking_idx;
DROP TABLE IF EXISTS expert_sessions;
