-- Rollback: 0007_playbooks
DROP INDEX IF EXISTS playbooks_published_idx;
DROP TABLE IF EXISTS playbooks;
