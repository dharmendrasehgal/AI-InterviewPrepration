-- Rollback: 0004_bookings
DROP INDEX IF EXISTS bookings_status_idx;
DROP INDEX IF EXISTS bookings_expert_idx;
DROP INDEX IF EXISTS bookings_candidate_idx;
DROP TABLE IF EXISTS bookings;
