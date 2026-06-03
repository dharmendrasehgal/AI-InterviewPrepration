-- Rollback: 0001_initial
-- Drops all Phase 1 tables in reverse FK dependency order

DROP TABLE IF EXISTS session_responses;
DROP TABLE IF EXISTS mock_sessions;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS question_answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS candidate_profiles;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
