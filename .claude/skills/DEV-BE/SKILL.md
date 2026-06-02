---
name: dev-backend-implementation
agent: DEV-BE · Backend Developer
layer: L3 · Engineering & Implementation
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: implement an API endpoint, write a service or domain
  layer, integrate a third-party service, build an async background job, write backend
  tests, implement analytics query endpoints, fix a backend bug, or produce OpenAPI docs.
reports-to: ARCH-BE
manages: []
---

# Backend Implementation — DEV-BE Skill

## Why this skill exists

Backend code is where correctness, security, and performance requirements collide.
A missing tenant filter is a data breach. A synchronous handler for a slow operation
blocks the thread pool. An undocumented endpoint breaks the frontend.
This skill defines the exact procedure for shipping backend code that is correct,
secure, tested, and documented.

---

## Step 0 — Before writing any code

Confirm you have all required inputs. Block and escalate to ARCH-BE if any are missing.

```
□ API contract from ARCH-BE for every endpoint in scope (method, path, auth, schema, errors)
□ Database schema / migration from DEV-DB for all tables involved
□ Auth and RBAC model from ARCH-BE's auth blueprint
□ Resilience requirements: rate limits, timeouts, retry policies for this endpoint
□ Acceptance Criteria from BA-01 for every story in scope
□ Third-party integration spec (if applicable) from ARCH-BE
```

If an API contract is ambiguous: document the ambiguity, propose an interpretation, and escalate to ARCH-BE for approval before implementing.

---

## §1 · Implementation checklist (per story)

Work through in order. Do not mark a story done until every box is checked.

```
□ Endpoint implemented per ARCH-BE contract exactly (method, path, request schema, response schema)
□ Auth middleware applied — correct role check per ARCH-BE auth blueprint
□ tenant_id extracted from validated JWT — NEVER from request body or query params
□ All DB queries include WHERE tenant_id = :tenant_id (OLTP) or partition filter (OLAP)
□ Input validated against schema before any business logic runs
□ Error responses use standard error envelope from ARCH-00 cross-cutting standards
□ Internal error details NOT returned to client (sanitised messages only)
□ Secrets accessed via vault/SSM — no hardcoded values or plain-text env vars
□ Rate limiting applied per ARCH-BE spec (if applicable)
□ Async job used for operations expected >500ms
□ Unit tests written: ≥85% branch coverage on domain/service logic
□ Integration test written for every endpoint (happy path + auth failure + validation failure)
□ Contract test added: response schema matches API contract definition
□ OpenAPI annotation updated to reflect implementation
□ PR description complete (see §5)
```

---

## §2 · Service layer patterns

### Endpoint structure (Node.js / Express / Fastify example)

```typescript
// Route → Controller → Service → Repository

// controller/resource.controller.ts
export async function listResources(req: AuthenticatedRequest, res: Response) {
  // 1. Extract tenant from JWT — NEVER from query/body
  const { tenantId, userId, roles } = req.auth

  // 2. Validate input
  const query = listResourcesSchema.parse(req.query) // throws ZodError → 400

  // 3. Delegate to service — controller has no business logic
  const result = await resourceService.list({ tenantId, ...query })

  // 4. Respond with standard envelope
  res.json({ data: result.items, meta: result.pagination })
}

// service/resource.service.ts
export async function list({ tenantId, page, perPage, filters }) {
  // Business logic lives here — no HTTP concerns
  const items = await resourceRepository.findAll({ tenantId, page, perPage, filters })
  return { items, pagination: buildPagination(items, page, perPage) }
}

// repository/resource.repository.ts
export async function findAll({ tenantId, page, perPage, filters }) {
  // Data access only — tenant_id always in WHERE
  return db.query(
    `SELECT * FROM resources WHERE tenant_id = $1 AND ... LIMIT $2 OFFSET $3`,
    [tenantId, perPage, (page - 1) * perPage]
  )
}
```

### Standard error envelope (from ARCH-00 cross-cutting standards)

```typescript
// ALWAYS use this shape for error responses
{
  "error": {
    "code": "VALIDATION_ERROR",          // machine-readable constant
    "message": "Validation failed.",     // user-safe message (no stack, no internals)
    "details": [                          // optional: field-level errors
      { "field": "email", "message": "Must be a valid email address." }
    ],
    "request_id": "uuid"                  // for log correlation
  }
}
```

```typescript
// Error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', details: err.flatten().fieldErrors, request_id: requestId }
    })
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, request_id: requestId } })
  }

  // Log full error internally — return sanitised response externally
  logger.error({ err, request_id: requestId }, 'Unhandled error')
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', request_id: requestId } })
})
```

---

## §3 · Analytics endpoint patterns

### Synchronous analytics query (<2s target)

```typescript
// GET /api/v1/analytics/metrics
// Uses pre-materialised views — never queries raw event tables directly
export async function getMetrics(req: AuthenticatedRequest, res: Response) {
  const { tenantId } = req.auth
  const { metricId, from, to, granularity } = metricsQuerySchema.parse(req.query)

  // Check cache first
  const cacheKey = buildCacheKey(tenantId, metricId, from, to, granularity)
  const cached = await redis.get(cacheKey)
  if (cached) return res.json(JSON.parse(cached))

  // Query OLAP store (never OLTP)
  const data = await analyticsDb.query(/* materialised view query */)

  // Cache with TTL matching data freshness SLO
  await redis.setex(cacheKey, DATA_FRESHNESS_TTL_SECONDS, JSON.stringify(data))
  res.json(data)
}
```

### Asynchronous report generation (>2s operations)

```typescript
// POST /api/v1/analytics/reports — enqueue job, return immediately
export async function createReport(req: AuthenticatedRequest, res: Response) {
  const { tenantId, userId } = req.auth
  const payload = createReportSchema.parse(req.body)

  const jobId = await reportQueue.add('generate-report', {
    tenantId, userId, ...payload,
    enqueuedAt: new Date().toISOString(),
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: false,    // keep for audit
    removeOnFail: false,        // keep for debugging
  })

  res.status(202).json({
    data: { job_id: jobId, status: 'queued', poll_url: `/api/v1/analytics/reports/${jobId}` }
  })
}

// GET /api/v1/analytics/reports/:jobId — poll for status
export async function getReportStatus(req: AuthenticatedRequest, res: Response) {
  const { tenantId } = req.auth
  const job = await reportQueue.getJob(req.params.jobId)

  if (!job || job.data.tenantId !== tenantId) {
    throw new NotFoundError('Report not found.')  // 404 — do not reveal existence
  }

  const state = await job.getState()
  res.json({
    data: {
      job_id: job.id,
      status: state,              // queued | active | completed | failed
      result_url: state === 'completed' ? job.returnvalue.url : null,
      error: state === 'failed' ? 'Report generation failed. Please retry.' : null,
    }
  })
}
```

---

## §4 · Testing patterns

### Unit test (domain service)

```typescript
// resource.service.test.ts
import { resourceService } from './resource.service'
import { resourceRepository } from './resource.repository'

vi.mock('./resource.repository')

describe('resourceService.list', () => {
  it('returns paginated resources scoped to tenant', async () => {
    const tenantId = 'tenant-uuid'
    vi.mocked(resourceRepository.findAll).mockResolvedValue([/* mock data */])

    const result = await resourceService.list({ tenantId, page: 1, perPage: 25 })

    expect(resourceRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId }) // tenant isolation: always verify tenantId was passed
    )
    expect(result.items).toHaveLength(1)
  })

  it('throws ForbiddenError when tenant_id mismatch', async () => {
    // Test that cross-tenant access fails
  })
})
```

### Integration test (API endpoint)

```typescript
// resource.integration.test.ts — tests against real DB (test container)
describe('GET /api/v1/resources', () => {
  it('returns 200 with tenant-scoped resources', async () => {
    const { token } = await createTestUser({ tenantId: 'tenant-a' })
    await seedResources({ tenantId: 'tenant-a', count: 3 })
    await seedResources({ tenantId: 'tenant-b', count: 2 }) // must NOT appear

    const res = await request(app)
      .get('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    // Verify no tenant-b resources leaked
    expect(res.body.data.every(r => r.tenant_id === 'tenant-a')).toBe(true)
  })

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/resources')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
```

---

## §5 · PR description format (mandatory)

```markdown
## Summary
[One sentence: what endpoint(s) or service(s) does this PR implement or fix?]

## Story / ticket
[US-XX-YY] [Link]

## API changes
| Endpoint | Method | Status |
|---|---|---|
| /api/v1/resources | GET | New |
| /api/v1/resources/:id | PUT | Modified |

## Contract compliance
- Matches ARCH-BE contract: [YES | NO — describe any deviation and escalation]
- Auth requirement: [JWT Bearer — roles: tenant-admin, power-user]
- Tenant isolation enforced: [YES — tenant_id extracted from JWT at line N]

## Security
- Input validation: [Zod schema at request handler entry]
- PII in logs: [NONE | describe if any]
- Secrets management: [vault/SSM — no hardcoded values]

## Testing
- Unit tests: [N new tests — X% branch coverage on service layer]
- Integration tests: [N new tests — endpoints covered]
- Contract tests: [updated / not applicable]

## Performance
- Async vs sync: [sync | async job — rationale]
- Query time (staging): [P95 Nms — within SLO YES/NO]
- Caching applied: [YES — TTL Ns | NO — rationale]

## Database changes
- Migrations required: [YES — V{NNN}__description | NO]
- New queries: [describe any new DB queries and their index usage]
```

---

## §6 · Hard rules

- **tenant_id comes from the JWT only** — a tenant_id in the request body or query params is user-supplied and untrusted; always override with the JWT claim.
- **Every DB query touching tenant data includes WHERE tenant_id = :tenantId** — no exceptions; this is checked in every PR review.
- **Internal errors never reach the client** — log the full error internally; return only a sanitised message.
- **No sync endpoint for operations >500ms** — use async job queue; never block the request thread.
- **No secret in code, config file, or plain-text environment variable** — vault/SSM only.
- **If the API contract is ambiguous, stop and escalate** — do not interpret unilaterally and ship; the contract is the source of truth.
- **Analytics queries hit the OLAP store only** — never route analytics aggregation through the OLTP database.
- **All endpoints have integration tests** — untested endpoints are not considered implemented.
