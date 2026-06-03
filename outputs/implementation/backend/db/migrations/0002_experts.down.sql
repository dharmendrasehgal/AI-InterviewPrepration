-- Rollback: 0002_experts
DROP INDEX IF EXISTS experts_user_id_idx;
DROP INDEX IF EXISTS experts_status_track_idx;
DROP TABLE IF EXISTS experts;
