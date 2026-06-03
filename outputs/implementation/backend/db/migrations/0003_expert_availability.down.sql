-- Rollback: 0003_expert_availability
DROP INDEX IF EXISTS expert_avail_unbooked_idx;
DROP INDEX IF EXISTS expert_avail_expert_start_idx;
DROP TABLE IF EXISTS expert_availability;
