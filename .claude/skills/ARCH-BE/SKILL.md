---
name: arch-backend-architecture
agent: ARCH-BE · Backend Architect
layer: L2 · Architecture & Design
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: design API contracts, define service boundaries,
  specify authentication/authorisation architecture, design the analytics query path,
  define resilience patterns, produce the security blueprint, or review DEV-BE implementation.
reports-to: ARCH-00
manages: [DEV-BE]
---

# Backend Architecture — ARCH-BE Skill

## Why this skill exists

Backend decisions govern correctness, security, and scale simultaneously.
An API contract written ambiguously will produce a frontend that assumes the wrong
schema and a QA suite that tests the wrong behaviour. A missing tenant filter
in a service becomes a data breach. This skill makes every backend decision
explicit and verifiable before a single line of implementation is written.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| New PRD from PM-01 | Map to services affected; draft or update API contracts |
| New DB schema from ARCH-DB | Review data access patterns; update service data access layer spec |
| Security or compliance requirement | Update Security Blueprint; issue guidance to DEV-BE |
| Performance concern from QA or PM-01 | Run Performance Triage (§5) |
| DEV-BE implementation question | Provide written answer referencing the architecture doc or API contract |
| Third-party integration request | Run Integration Evaluation (§6) |

---

## §1 · API Contract format (OpenAPI-aligned markdown)

Every endpoint must have a complete contract before DEV-BE begins implementation.

```markdown
## Endpoint: [METHOD] /api/v{N}/[resource]
**Service:** [service name]
**Auth:** Required (JWT Bearer) | Public | Service-to-Service (mTLS)
**Tenant-scoped:** YES | NO
**Rate limit:** [N] requests / minute per tenant

### Request
**Path parameters:**
| Param | Type | Required | Description |
|---|---|---|---|

**Query parameters:**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|

**Request body (JSON):**
```json
{
  "field": "string — description"
}
```

### Response — 200 OK
```json
{
  "data": {},
  "meta": { "page": 1, "per_page": 25, "total": 100 }
}
```

### Error responses
| HTTP Status | Error Code | Condition |
|---|---|---|
| 400 | VALIDATION_ERROR | Request body fails schema validation |
| 401 | UNAUTHORIZED | Missing or expired JWT |
| 403 | FORBIDDEN | Valid JWT but insufficient role |
| 404 | NOT_FOUND | Resource does not exist or belongs to another tenant |
| 429 | RATE_LIMIT_EXCEEDED | Per-tenant rate limit hit |
| 500 | INTERNAL_ERROR | Unexpected server error (sanitised — no internal details) |

### Notes
[Any edge cases, deprecation timeline, or migration notes]
```

**Rule:** All error responses use the standard envelope from ARCH-00's cross-cutting standards.
Internal error details are NEVER returned to API consumers.

---

## §2 · Service boundary decision framework

When deciding whether a capability is a new service or a module within an existing service:

| Factor | New service | Module in existing service |
|---|---|---|
| Independent scaling needed? | YES → new service | NO → module |
| Independent deployment cycle? | YES → new service | NO → module |
| Different data store needed? | YES → new service | NO → module |
| Team/domain boundary? | YES → new service | NO → module |
| Currently <50K req/day? | — | Default to module; extract later |

**Default to modules.** Premature microservice extraction creates distributed systems
complexity without scale benefits. Document the extraction trigger in the architecture doc.

---

## §3 · Authentication & Authorisation Blueprint

```markdown
# Auth Blueprint
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-BE

## Token strategy
- Type: JWT (RS256 signed — asymmetric keys)
- Access token TTL: 15 minutes
- Refresh token TTL: 30 days (sliding window)
- Token storage: httpOnly cookie (NOT localStorage)

## RBAC model
| Role | Scope | Permissions |
|---|---|---|
| tenant-admin | tenant | Full CRUD on all tenant resources |
| power-user | tenant | Read/write own resources; analytics read |
| end-user | tenant | Read own data and shared dashboards |
| data-engineer | tenant | Data source config; pipeline management |

## Tenant isolation enforcement
1. JWT contains: user_id, tenant_id, roles[]
2. Every service extracts tenant_id from validated JWT — never from request body/query params
3. Every DB query includes WHERE tenant_id = :tenant_id
4. Row-Level Security as second enforcement layer (database-level)
5. Cross-tenant requests return 404 (not 403) — do not confirm resource existence

## Service-to-service auth
- Internal services: mTLS with short-lived certificates
- External webhooks: HMAC-SHA256 signature on payload + timestamp

## OAuth2 / OIDC (SSO)
- Supported providers: [list]
- Callback validation: state parameter (CSRF), nonce (replay protection)
- Scopes requested: minimum required only
```

---

## §4 · Analytics query path architecture

The analytics path must be architecturally isolated from the transactional API.

```markdown
# Analytics Query Architecture

## Separation of concerns
- Transactional API: /api/v1/... → OLTP database (PostgreSQL)
- Analytics API: /api/v1/analytics/... → OLAP database (ClickHouse / BigQuery / Redshift)
- NEVER route analytics queries through the transactional service

## Query endpoint patterns
- Synchronous (< 2s): Simple aggregations with pre-materialised views
  GET /api/v1/analytics/metrics?from=...&to=...&granularity=day
- Asynchronous (> 2s): Heavy reports queued as jobs
  POST /api/v1/analytics/reports → returns { job_id }
  GET  /api/v1/analytics/reports/{job_id} → returns status + result URL when done

## Caching strategy
- Query results cached in Redis with TTL matching data freshness SLO
- Cache key: hash(tenant_id + query_params)
- Cache invalidation: on data pipeline completion event

## Rate limiting (analytics endpoints)
- Light queries: 60/min per tenant
- Heavy report jobs: 5/min per tenant; max 3 concurrent jobs per tenant
```

---

## §5 · Performance Triage Protocol

When an API performance issue is reported:

**Step 1 — Gather data**
- P95 / P99 latency from APM (Datadog / New Relic)
- Slow query log from the database
- Queue depth if async job involved

**Step 2 — Classify**

| Symptom | Likely cause | Investigation |
|---|---|---|
| High latency on all endpoints | Connection pool exhausted | Check pool size vs. concurrent requests |
| High latency on single endpoint | N+1 query or missing index | Enable query logging; check EXPLAIN plan with DEV-DB |
| Analytics queries timing out | Missing materialised view | Route through async job; flag to ARCH-DB |
| Queue depth growing | Worker under-scaled | Flag to ARCH-DO for autoscaling |
| Spike on specific tenant | Tenant-level abuse | Check rate limiter; flag to PM-01 |

**Step 3 — Fix protocol**
- Fixes that change DB queries: coordinate with DEV-DB
- Fixes that change infrastructure: coordinate with ARCH-DO
- All fixes require: before/after P95 latency documented in PR

---

## §6 · Third-party integration evaluation

```markdown
## Integration Evaluation: [Service Name]
Date: YYYY-MM-DD | Evaluator: ARCH-BE

□ Data sent to third party: [list fields] — PII involved? [YES / NO]
□ If PII: DPA in place? GDPR/SOC2 compliant? [YES / NO]
□ Auth mechanism: [API key / OAuth2 / webhook HMAC / other]
□ Secrets stored in: [vault / SSM — NEVER in code or env files]
□ Failure mode: if this service is unavailable, what breaks? [describe]
□ Circuit breaker required: [YES / NO] — threshold: [N failures in Xs]
□ Retry policy: [max N retries, exponential backoff, jitter]
□ Webhook validation: [HMAC-SHA256 / signature header / other]
□ SLA offered by provider: [uptime %]
□ Alternative if provider fails: [fallback or degraded mode]

Decision: APPROVED | REJECTED | APPROVED WITH CONDITIONS
```

---

## §7 · Resilience patterns reference

| Pattern | When to apply | DEV-BE implementation note |
|---|---|---|
| Rate limiting | All tenant-facing endpoints | Per-tenant bucket in Redis; 429 with Retry-After header |
| Circuit breaker | All third-party service calls | Open after N failures; half-open after timeout |
| Retry with backoff | Async jobs, internal service calls | Max 3 retries; exponential backoff + jitter; idempotency required |
| Dead-letter queue | All async job queues | After max retries; alert triggered; manual requeue available |
| Idempotency key | Payment and state-mutating POST endpoints | Client-supplied key; server deduplicates within 24h |
| Timeout | All outbound HTTP calls | Connect: 2s; Read: 10s for sync, 30s for async |
| Bulkhead | Analytics vs. transactional thread pools | Separate worker pools; analytics cannot starve transactional |

---

## §8 · Hard rules

- **Every endpoint has a documented auth requirement** before DEV-BE writes a single line.
- **Tenant isolation is enforced server-side** — client-supplied tenant_id in request body is NEVER trusted; always extract from validated JWT.
- **Analytics queries never share a database connection pool with transactional queries.**
- **No synchronous endpoint for operations expected >500ms** — use async job queue.
- **All third-party secrets live in vault/SSM** — a secret in code or a plain-text env file is a P0 security incident.
- **Every new endpoint has a contract document** reviewed and approved by ARCH-BE before implementation starts.
- **Internal errors are never surfaced to API consumers** — all 5xx responses return a sanitised message only.
- **Brief DEV-BE in writing** with the API contract, auth requirement, and resilience patterns before each sprint.
