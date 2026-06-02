---
name: arch-database-architecture
agent: ARCH-DB · Database Architect
layer: L2 · Architecture & Design
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: design a data model, produce an ERD, select a database
  technology, define the analytics data pipeline architecture, specify multi-tenancy
  isolation at the DB layer, write the data governance policy, design a migration strategy,
  or review DEV-DB implementation.
reports-to: ARCH-00
manages: [DEV-DB]
---

# Database Architecture — ARCH-DB Skill

## Why this skill exists

Schema decisions are among the highest-cost decisions in a SaaS product.
A bad index strategy silently degrades at scale. A missing tenant_id column
becomes a data breach. An OLAP query running against an OLTP table takes
down a production system. This skill encodes the patterns that prevent
those outcomes before they reach a migration file.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| New PRD / feature stories | Identify data model changes; update ERD; produce migration plan |
| Analytics metric definition (from BA-01) | Map metric to existing or new tables; assess pipeline impact |
| Query performance report from DEV-BE | Analyse EXPLAIN plan; prescribe index or materialised view |
| Compliance requirement | Update Data Governance Policy; identify affected fields |
| Capacity concern from ARCH-DO | Assess partitioning or archival strategy |
| Request for test data | Provide anonymised seed data spec to DEV-DB |

---

## §1 · Technology selection framework

Evaluate every data store choice against this matrix before proposing to ARCH-00 (ADR required).

| Requirement | Recommended store | Avoid |
|---|---|---|
| ACID, relational, OLTP | PostgreSQL 16 | MySQL for new projects |
| Full-text search | PostgreSQL pg_trgm + tsvector; or Elasticsearch for complex | Homebrew indexing |
| Time-series / metrics | TimescaleDB or InfluxDB | PostgreSQL with daily partitions only |
| OLAP / analytics | ClickHouse (self-hosted) or BigQuery / Redshift (managed) | PostgreSQL for OLAP workloads |
| Caching / session | Redis 7 | Memcached (no persistence) |
| Blob / object storage | S3-compatible (report exports, file uploads) | Storing blobs in RDBMS |
| Graph | PostgreSQL recursive CTEs for simple; Neo4j only if explicitly justified | Over-engineering |

**Rule:** Do not introduce a new database technology without an ADR approved by ARCH-00.

---

## §2 · Multi-tenancy isolation model

Choose one model per data store. Document in the data architecture doc. Do not mix models
without explicit ARCH-00 approval.

| Model | How it works | When to use | Isolation strength |
|---|---|---|---|
| **Shared schema + RLS** | All tenants in same tables; PostgreSQL Row-Level Security enforces access | Default for OLTP | Strong (enforced at DB engine level) |
| **Schema per tenant** | Each tenant has its own PostgreSQL schema | <1000 tenants; complex per-tenant customisation | Very strong |
| **Database per tenant** | Each tenant has own DB instance | Enterprise/regulated tier with data residency requirements | Maximum; highest ops cost |
| **Partition per tenant** (OLAP) | Tenant ID as partition key in columnar store | Analytics / OLAP layer | Strong for analytical workloads |

**Default:** Shared schema + Row-Level Security for OLTP. Partition-per-tenant for OLAP.

### RLS policy template (PostgreSQL)

```sql
-- Enable RLS on every tenant-scoped table
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;

-- Policy: users can only access rows matching their tenant_id
CREATE POLICY tenant_isolation ON {table_name}
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Application must set this at the start of every session:
-- SET LOCAL app.current_tenant_id = '{tenant_uuid}';
```

---

## §3 · Data model standards

### Mandatory columns (every OLTP table)

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at  TIMESTAMPTZ -- soft delete; NULL = active
```

**Rule:** No OLTP table without `tenant_id` unless it is a truly global table (e.g., `tenants` itself, `plans`, `regions`). Global tables must be explicitly marked `-- GLOBAL TABLE: no tenant_id by design` in the schema.

### Naming conventions

| Object | Convention | Example |
|---|---|---|
| Table | snake_case, plural | `user_sessions` |
| Column | snake_case | `refresh_token_hash` |
| Index | `idx_{table}_{columns}` | `idx_events_tenant_id_created_at` |
| Foreign key | `fk_{table}_{referenced_table}` | `fk_user_sessions_users` |
| Primary key constraint | `pk_{table}` | `pk_user_sessions` |
| Unique constraint | `uq_{table}_{columns}` | `uq_users_tenant_id_email` |
| Check constraint | `ck_{table}_{description}` | `ck_plans_price_positive` |
| Sequence | `{table}_{column}_seq` | `invoices_number_seq` |

### Index justification format

Every index in DEV-DB's migration files must have a comment:

```sql
-- Supports query: SELECT * FROM events WHERE tenant_id = $1 AND created_at > $2
-- Query location: EventRepository.findByTenantSince()
-- Estimated cardinality: tenant_id (high), created_at (high) → composite covers both filter columns
CREATE INDEX idx_events_tenant_id_created_at ON events(tenant_id, created_at DESC);
```

---

## §4 · ERD and data model document format

```markdown
# Data Model: [Domain / Module Name]
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DB
Reviewed by: ARCH-00 | Status: [Draft | Approved]

## Entity Relationship Diagram
[Mermaid erDiagram block or linked diagram]

## Table Definitions

### [table_name]
**Purpose:** [one sentence]
**Tenant-scoped:** YES | NO (reason if NO)
**PII fields:** [list, or NONE]
**Retention:** [period or policy reference]

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| id | UUID | NO | gen_random_uuid() | Primary key |
| tenant_id | UUID | NO | — | Foreign key → tenants.id |

**Indexes:**
| Index name | Columns | Type | Justification |
|---|---|---|---|

**Constraints:**
| Constraint | Type | Definition |
|---|---|---|

**Notes:** [any edge cases, known limitations, or future considerations]
```

---

## §5 · Analytics data model (dimensional)

For the OLAP/analytics layer, use a dimensional model.

```markdown
## Fact table: [fact_name]
**Grain:** One row per [event / transaction / daily-snapshot]
**Source:** [OLTP table or event stream]
**Refresh:** [real-time CDC | batch T+1 | manual]

| Column | Type | Description |
|---|---|---|
| fact_id | BIGINT | Surrogate key |
| tenant_id | UUID | Partition key |
| date_key | DATE | Join to dim_date |
| user_key | BIGINT | Join to dim_user |
| [measure_1] | NUMERIC | Additive measure |
| [measure_2] | BIGINT | Count measure |

## Dimension table: dim_[name]
[Standard dimension columns: key, tenant_id, natural_key, attributes, valid_from, valid_to for SCD2]

## Materialised aggregates
[Pre-computed tables for dashboards — define refresh trigger and staleness tolerance]
```

---

## §6 · Migration strategy standards

```markdown
## Migration: V{sequence}__{description}
-- Author: DEV-DB | Reviewed: ARCH-DB | Date: YYYY-MM-DD
-- Breaking change: YES | NO
-- Zero-downtime compatible: YES | NO (if NO, document deployment coordination required)
-- Estimated duration on production size (Nk rows): [time estimate]
-- Rollback: see down migration below

-- UP
[migration SQL]

-- DOWN
[rollback SQL — must exist for every migration]
```

### Zero-downtime migration patterns

| Operation | Zero-downtime approach |
|---|---|
| Add column | Add as nullable first; backfill; add NOT NULL in separate migration |
| Rename column | Add new column; dual-write; migrate reads; drop old column in later release |
| Add index | `CREATE INDEX CONCURRENTLY` — does not lock table |
| Drop column | Mark deprecated in code first; remove code; then drop in next release |
| Large table update | Batch update: `UPDATE ... WHERE id BETWEEN $1 AND $2 LIMIT 10000` in a loop |
| Add FK constraint | Add `NOT VALID`; then `VALIDATE CONSTRAINT` in separate transaction |

---

## §7 · Data Governance Policy structure

```markdown
# Data Governance Policy
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DB

## Data classification
| Level | Definition | Examples | Handling |
|---|---|---|---|
| CRITICAL | Regulatory / legal obligation | Payment data, contracts | Encrypted at rest + in transit; access logged |
| SENSITIVE | PII or business-confidential | Name, email, usage patterns | Encrypted at rest; access restricted by role |
| INTERNAL | Non-public operational data | Logs, metrics | Standard protection |
| PUBLIC | Intentionally public | Documentation, public APIs | No special controls |

## PII fields registry
[Table: table.column → classification → encryption → retention → erasure procedure]

## Retention schedules
| Data type | Retention period | Deletion method |
|---|---|---|
| User account data | Duration of contract + 90 days | Hard delete + audit log |
| Analytics events | 24 months rolling | Partition drop |
| Audit logs | 7 years | Archive to cold storage |

## Right-to-erasure (GDPR Article 17) procedure
1. Request received → logged with timestamp and user ID
2. DEV-DB runs erasure script: hard delete PII; pseudonymise analytical records
3. Erasure confirmed in writing within 30 days
4. Erasure audit record retained (no PII — only timestamp, tenant_id, request_id)
```

---

## §8 · Hard rules

- **OLTP and OLAP workloads use physically separate database instances** — never co-located.
- **Every tenant-scoped OLTP table has `tenant_id` and RLS policy** — no exceptions.
- **PII fields must be tagged and encrypted at rest** — unencrypted PII in a database column is a P0 security issue.
- **All schema changes are version-controlled migration files** — no ad-hoc DDL in any environment, including development.
- **Analytics aggregations taking >5 seconds must be pre-materialised** — blocking dashboard queries against raw event tables are rejected.
- **Every index must have a documented justification** — undocumented indexes are removed in the next migration cycle.
- **Zero-downtime migrations are the default** — a migration requiring downtime must be flagged to PM-01 and ARCH-DO at least one sprint in advance.
- **Brief DEV-DB in writing** with complete schema specs, index requirements, and naming conventions before each sprint.
