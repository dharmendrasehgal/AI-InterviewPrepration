---
name: dev-database-implementation
agent: DEV-DB · Database Developer
layer: L3 · Engineering & Implementation
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: write a database migration, implement a schema change,
  create indexes, write stored procedures or views, optimise a slow query, build
  analytics pipeline scripts or dbt models, create seed data, write data quality
  validation scripts, or document a schema.
reports-to: ARCH-DB
manages: []
---

# Database Implementation — DEV-DB Skill

## Why this skill exists

Schema changes are among the most expensive operations to reverse in a live system.
A migration that locks a table drops production. An index created on the wrong columns
wastes space and slows writes. An analytics model querying raw tables without partition
filters scans billions of rows. This skill enforces patterns that make database work
safe, reversible, and verifiable before any migration reaches staging.

---

## Step 0 — Before writing any migration

Confirm you have all required inputs. Block and escalate to ARCH-DB if any are missing.

```
□ Data Model Document and ERD from ARCH-DB for the tables involved
□ Query patterns from ARCH-BE / DEV-BE that drive index design
□ Data Governance annotations (PII fields, retention policy) from ARCH-DB
□ Migration naming sequence: check last migration number in version control
□ Zero-downtime requirement confirmed for production-sized table (>1M rows)
□ Rollback script designed before the up script is written
```

---

## §1 · Migration implementation checklist

Work through in order. Every migration must pass before merge.

```
□ File named correctly: V{NNN}__{description_in_snake_case}.sql
□ Header comment complete (see §2)
□ Up migration written
□ Down migration written and tested locally (rollback works cleanly)
□ Zero-downtime pattern applied for all table operations (see §3)
□ tenant_id present on every new tenant-scoped table
□ RLS policy added for every new tenant-scoped table (see §4)
□ Mandatory columns present: id, tenant_id, created_at, updated_at, deleted_at
□ Every new index has a justification comment (query pattern it serves)
□ PII columns encrypted or flagged for encryption (per Data Governance policy)
□ Migration tested against a production-sized dataset in staging: duration noted in header
□ ARCH-DB review received before merge to main
```

---

## §2 · Migration file format

```sql
-- =============================================================================
-- Migration: V0042__add_analytics_config_to_tenants.sql
-- Author: DEV-DB
-- Date: YYYY-MM-DD
-- Reviewed by: ARCH-DB
-- Breaking change: NO
-- Zero-downtime compatible: YES
-- Estimated duration (production ~5M rows): < 2 seconds (metadata change only)
-- Rollback: see DOWN section below
-- Related story: US-04-07 — Tenant analytics configuration
-- =============================================================================

-- ========================= UP =========================

ALTER TABLE tenants
  ADD COLUMN analytics_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN analytics_config      JSONB,
  ADD COLUMN analytics_enabled_at  TIMESTAMPTZ;

-- Supports query: SELECT * FROM tenants WHERE analytics_enabled = TRUE AND tenant_id = $1
-- Query location: TenantRepository.findAnalyticsEnabled()
CREATE INDEX CONCURRENTLY idx_tenants_analytics_enabled
  ON tenants(analytics_enabled)
  WHERE analytics_enabled = TRUE; -- partial index: only indexes enabled tenants

-- ========================= DOWN =======================

DROP INDEX CONCURRENTLY IF EXISTS idx_tenants_analytics_enabled;

ALTER TABLE tenants
  DROP COLUMN IF EXISTS analytics_enabled_at,
  DROP COLUMN IF EXISTS analytics_config,
  DROP COLUMN IF EXISTS analytics_enabled;
```

---

## §3 · Zero-downtime migration patterns

Always apply these patterns for any migration on a table with >100K rows in production.

### Adding a column

```sql
-- Step 1 (this migration): add as nullable — no lock, no table rewrite
ALTER TABLE resources ADD COLUMN status TEXT; -- nullable first

-- Step 2 (next migration or backfill job): populate existing rows in batches
-- DO NOT backfill in the same migration as the column addition
DO $$
DECLARE
  batch_size INT := 10000;
  last_id    UUID := '00000000-0000-0000-0000-000000000000';
  batch_last UUID;
BEGIN
  LOOP
    WITH batch AS (
      SELECT id FROM resources WHERE id > last_id AND status IS NULL
      ORDER BY id LIMIT batch_size
    )
    UPDATE resources r SET status = 'active'
    FROM batch WHERE r.id = batch.id
    RETURNING r.id INTO batch_last;

    EXIT WHEN NOT FOUND;
    last_id := batch_last;
    PERFORM pg_sleep(0.1); -- brief pause between batches
  END LOOP;
END $$;

-- Step 3 (later migration): add NOT NULL constraint after all rows populated
ALTER TABLE resources ALTER COLUMN status SET NOT NULL;
ALTER TABLE resources ALTER COLUMN status SET DEFAULT 'active';
```

### Creating an index

```sql
-- ALWAYS use CONCURRENTLY — avoids table lock
-- Never use plain CREATE INDEX on a live table with significant traffic
CREATE INDEX CONCURRENTLY idx_resources_tenant_id_status
  ON resources(tenant_id, status);
-- Note: CONCURRENTLY cannot run inside a transaction block
```

### Renaming a column

```sql
-- NEVER rename directly in production — it breaks running application code
-- Phase 1: Add new column, dual-write in application (DEV-BE coordinates)
ALTER TABLE resources ADD COLUMN resource_name TEXT;

-- Phase 2: Backfill
UPDATE resources SET resource_name = name WHERE resource_name IS NULL;

-- Phase 3: Switch application reads to new column (deploy)

-- Phase 4 (next release): Drop old column
ALTER TABLE resources DROP COLUMN name;
```

### Dropping a column

```sql
-- NEVER drop in the same migration as the application code stops using it
-- The application must be deployed and confirmed stable first

-- Safe drop (after application no longer references the column):
ALTER TABLE resources DROP COLUMN IF EXISTS deprecated_field;
```

---

## §4 · Row-Level Security implementation

Every new tenant-scoped table must have RLS enabled and a policy attached.

```sql
-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;

-- Isolation policy — reads and writes scoped to current tenant
CREATE POLICY tenant_isolation_policy ON {table_name}
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Service account bypasses RLS for migrations and admin tasks
-- (service account has BYPASSRLS privilege — documented in ARCH-DB governance policy)

-- Verify policy is active:
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename = '{table_name}';
```

---

## §5 · Analytics pipeline patterns (dbt / SQL transforms)

### dbt model structure

```sql
-- models/analytics/fct_events.sql
{{
  config(
    materialized='incremental',
    unique_key='event_id',
    partition_by={ 'field': 'event_date', 'data_type': 'date' },
    cluster_by=['tenant_id', 'event_type'],
    on_schema_change='fail'  -- explicit schema change management
  )
}}

WITH source AS (
  SELECT * FROM {{ source('oltp', 'events') }}
  {% if is_incremental() %}
    -- Only process new rows since last run
    WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
  {% endif %}
),

transformed AS (
  SELECT
    event_id,
    tenant_id,
    user_id,
    event_type,
    DATE(created_at)                    AS event_date,
    TIMESTAMP_TRUNC(created_at, HOUR)   AS event_hour,
    properties                           -- JSONB / JSON
  FROM source
  WHERE tenant_id IS NOT NULL  -- guard against null tenant_id
    AND event_type IS NOT NULL
)

SELECT * FROM transformed
```

### Materialised view for dashboard aggregations

```sql
-- Pre-compute expensive aggregations; refresh on pipeline completion
CREATE MATERIALIZED VIEW mv_daily_active_users AS
SELECT
  tenant_id,
  event_date,
  COUNT(DISTINCT user_id) AS daily_active_users
FROM fct_events
GROUP BY tenant_id, event_date;

-- Index to support dashboard queries
CREATE UNIQUE INDEX idx_mv_dau_tenant_date
  ON mv_daily_active_users(tenant_id, event_date);

-- Refresh (called by pipeline orchestrator on pipeline completion):
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_active_users;
```

---

## §6 · Query optimisation workflow

When a slow query is reported by DEV-BE or QA:

**Step 1 — Get the EXPLAIN ANALYZE output**

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ...;
-- Run in a READ-ONLY transaction in staging against production-sized data
```

**Step 2 — Interpret the plan**

| Signal | What it means | Fix |
|---|---|---|
| Seq Scan on large table | Missing index | Add composite index covering WHERE columns |
| High rows estimate vs actual | Stale statistics | `ANALYZE table_name;` |
| Hash Join on large sets | May benefit from index | Evaluate index-based nested loop |
| Nested Loop × millions | N+1 query pattern | Rewrite as single query with JOIN |
| Bitmap Index Scan | Index exists but selectivity low | Check if composite index would help |
| Buffers: read=N high | Disk I/O — not cached | Consider pg_prewarm; evaluate partitioning |

**Step 3 — Document the fix**

```sql
-- Before: Seq Scan — 8,420ms P95 (reported in DEV-BE PR #147)
-- Root cause: no index on (tenant_id, created_at) — full table scan for date-range queries
-- Fix: composite index covering both filter columns
-- After: Index Scan — 12ms P95 (verified in staging with 5M row dataset)
CREATE INDEX CONCURRENTLY idx_events_tenant_id_created_at
  ON events(tenant_id, created_at DESC);
```

---

## §7 · Seed data standards

Seed data must be realistic in shape (column types, relationships, nullability patterns) but must never contain real user data.

```sql
-- seed/dev/01_tenants.sql
INSERT INTO tenants (id, name, plan_tier, analytics_enabled, created_at)
VALUES
  ('tenant-aaaaaaaa-0001', 'Acme Corp (Dev)',    'enterprise', TRUE,  NOW() - INTERVAL '6 months'),
  ('tenant-aaaaaaaa-0002', 'Globex Inc (Dev)',   'pro',        FALSE, NOW() - INTERVAL '3 months'),
  ('tenant-aaaaaaaa-0003', 'Initech Ltd (Dev)',  'starter',    FALSE, NOW() - INTERVAL '1 month');

-- Set RLS context for subsequent seed inserts (dev only)
SET LOCAL app.current_tenant_id = 'tenant-aaaaaaaa-0001';
```

---

## §8 · Data quality validation scripts

Run after every migration and pipeline execution.

```sql
-- Null rate check: critical NOT NULL columns should have 0% nulls
SELECT
  'events'             AS table_name,
  COUNT(*)             AS total_rows,
  COUNT(*) FILTER (WHERE tenant_id IS NULL)  AS null_tenant_count,
  COUNT(*) FILTER (WHERE user_id IS NULL)    AS null_user_count,
  COUNT(*) FILTER (WHERE event_type IS NULL) AS null_event_type_count
FROM events;

-- Referential integrity spot check
SELECT COUNT(*) AS orphaned_events
FROM events e
LEFT JOIN tenants t ON e.tenant_id = t.id
WHERE t.id IS NULL; -- should be 0

-- Tenant isolation sanity check (for RLS validation)
-- Run as application service account (not superuser) to exercise RLS
SET LOCAL app.current_tenant_id = 'tenant-aaaaaaaa-0001';
SELECT COUNT(*) FROM events; -- should only count tenant-0001 rows
```

---

## §9 · Hard rules

- **Never run DDL directly against production** — all schema changes go through version-controlled, reviewed migrations.
- **Every migration has a down script** — tested locally before the PR is opened.
- **`CREATE INDEX CONCURRENTLY` always** for live tables — never a locking index creation in production.
- **New OLTP tables require RLS** — no tenant-scoped table ships without a policy attached.
- **PII columns must be flagged in the migration header** and confirmed with ARCH-DB before merging.
- **Analytics materialised views, not raw table scans** — any query against the raw events table without a partition filter is rejected in PR review.
- **Large table migrations run in batches** — a single UPDATE on 10M rows is an outage waiting to happen.
- **Never touch the analytics OLAP store from the OLTP migration tooling** — they have separate connection configs and separate migration runners.
