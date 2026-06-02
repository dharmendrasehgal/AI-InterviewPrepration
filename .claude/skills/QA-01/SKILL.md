---
name: qa-test-implementation
agent: QA-01 · QA Developer
layer: L4 · Quality Assurance
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: write automated E2E tests, write API integration tests,
  write analytics accuracy tests, write load tests, execute exploratory testing,
  file a bug report, run a regression suite, maintain test fixtures, or produce
  a test execution report.
reports-to: QA-00
manages: []
---

# Test Implementation — QA-01 Skill

## Why this skill exists

Automated tests are only valuable if they catch real failures reliably and do not
produce false positives. Flaky tests erode trust; untested edge cases ship bugs.
This skill defines how to build a test suite that is comprehensive, deterministic,
and actionable — and how to file bugs that developers can fix without a follow-up call.

---

## Step 0 — Before writing any test

Confirm you have all required inputs. Block and escalate to QA-00 if any are missing.

```
□ Acceptance Criteria from BA-01 for every story to be tested
□ API contract from ARCH-BE (for integration and contract tests)
□ Test Strategy from QA-00 — which test types and coverage targets apply
□ Regression test plan from QA-00 (for release validation)
□ Staging environment URL and build SHA confirmed from DEV-DO
□ Test data fixtures or seed script available
□ Access to analytics source data (for accuracy tests)
```

---

## §1 · Test implementation checklist (per story)

```
□ E2E tests written for all Acceptance Criteria happy paths
□ E2E test written for the primary error path (validation failure / auth failure)
□ Multi-tenant isolation test written (if story touches any tenant-scoped data)
□ API integration tests cover: happy path, auth failure (401/403), validation failure (400), not-found (404)
□ Analytics accuracy test written (if story delivers a metric or dashboard)
□ Accessibility test run (axe-core automated + keyboard navigation check)
□ Test data fixtures updated if new entities are needed
□ All tests pass locally and in CI before reporting complete
□ Test execution report produced (see §6)
```

---

## §2 · E2E test patterns (Playwright)

### Standard test structure

```typescript
// tests/e2e/features/[feature-name].spec.ts
import { test, expect } from '@playwright/test'
import { loginAs, createTenant } from '../helpers/auth'
import { seedResources } from '../helpers/fixtures'

test.describe('[Feature: Resource Management]', () => {

  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh isolated tenant — never share state between tests
    await createTenant('tenant-test-001')
    await loginAs(page, { tenantId: 'tenant-test-001', role: 'tenant-admin' })
  })

  test('admin can create a resource', async ({ page }) => {
    await page.goto('/resources')
    await page.getByRole('button', { name: 'Create resource' }).click()
    await page.getByLabel('Resource name').fill('My First Resource')
    await page.getByRole('button', { name: 'Save' }).click()

    // Assert on user-visible outcome — not implementation details
    await expect(page.getByRole('alert')).toContainText('Resource created successfully')
    await expect(page.getByRole('row', { name: 'My First Resource' })).toBeVisible()
  })

  test('end user cannot access admin settings', async ({ page }) => {
    await loginAs(page, { tenantId: 'tenant-test-001', role: 'end-user' })
    await page.goto('/settings/admin')
    // Should redirect or show forbidden — not the admin page
    await expect(page).not.toHaveURL('/settings/admin')
    await expect(page.getByText('Access denied')).toBeVisible()
  })

  test('error state is shown when API fails', async ({ page }) => {
    await page.route('/api/v1/resources', route => route.fulfill({ status: 500 }))
    await page.goto('/resources')
    await expect(page.getByRole('alert', { name: /error/i })).toBeVisible()
    await expect(page.getByText('Try again')).toBeVisible()
  })

})
```

### Multi-tenant isolation E2E test (mandatory pattern)

```typescript
test('tenant isolation: tenant A cannot see tenant B resources', async ({ browser }) => {
  // Create two separate isolated browser contexts
  const contextA = await browser.newContext()
  const contextB = await browser.newContext()
  const pageA = await contextA.newPage()
  const pageB = await contextB.newPage()

  await createTenant('tenant-a')
  await createTenant('tenant-b')
  const resource = await seedResources({ tenantId: 'tenant-a', count: 1 })

  await loginAs(pageA, { tenantId: 'tenant-a', role: 'tenant-admin' })
  await loginAs(pageB, { tenantId: 'tenant-b', role: 'tenant-admin' })

  // Tenant B attempts to access Tenant A's resource by ID
  await pageB.goto(`/resources/${resource.id}`)

  // Must redirect or show not-found — NEVER show Tenant A's data
  await expect(pageB).not.toHaveURL(`/resources/${resource.id}`)
  // Accept: redirect to /resources (list), 404 page, or access-denied page
  await expect(pageB.getByText(resource.name)).not.toBeVisible()

  await contextA.close()
  await contextB.close()
})
```

---

## §3 · API integration test patterns

```typescript
// tests/integration/api/resources.test.ts
import request from 'supertest'
import { app } from '../../src/app'
import { createTestJWT, seedDB, clearDB } from '../helpers'

describe('GET /api/v1/resources', () => {

  beforeEach(async () => {
    await clearDB()
    await seedDB({
      tenants: ['tenant-a', 'tenant-b'],
      resources: [
        { tenantId: 'tenant-a', count: 3 },
        { tenantId: 'tenant-b', count: 2 },
      ]
    })
  })

  it('200 — returns tenant-scoped resources only', async () => {
    const token = createTestJWT({ tenantId: 'tenant-a', role: 'tenant-admin' })

    const res = await request(app)
      .get('/api/v1/resources')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(3)
    // Verify no tenant-b records leaked
    res.body.data.forEach(r => expect(r.tenant_id).toBe('tenant-a'))
    // Verify response shape matches ARCH-BE contract
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      meta: { page: expect.any(Number), per_page: expect.any(Number), total: expect.any(Number) }
    })
  })

  it('401 — rejects request with no token', async () => {
    const res = await request(app).get('/api/v1/resources')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('403 — rejects end-user accessing admin endpoint', async () => {
    const token = createTestJWT({ tenantId: 'tenant-a', role: 'end-user' })
    const res = await request(app)
      .get('/api/v1/admin/resources')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('404 — returns 404 (not 403) for cross-tenant resource access', async () => {
    const tenantBResource = await getResourceFromDB({ tenantId: 'tenant-b' })
    const token = createTestJWT({ tenantId: 'tenant-a', role: 'tenant-admin' })

    const res = await request(app)
      .get(`/api/v1/resources/${tenantBResource.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)  // NOT 403 — do not confirm existence
  })

})
```

---

## §4 · Analytics accuracy test pattern

```typescript
// tests/analytics/accuracy/mau.test.ts

describe('Analytics accuracy: Monthly Active Users', () => {

  it('dashboard MAU matches source event data within tolerance', async () => {
    const TOLERANCE = 0.01 // 1%
    const tenantId  = 'tenant-accuracy-fixture'
    const month     = '2025-02'

    // 1. Compute expected value from OLTP source data
    const expected = await oltp.query<number>(
      `SELECT COUNT(DISTINCT user_id) FROM events
       WHERE tenant_id = $1
         AND created_at >= '2025-02-01'
         AND created_at < '2025-03-01'`,
      [tenantId]
    )

    // 2. Read actual value from analytics API
    const token = createTestJWT({ tenantId, role: 'power-user' })
    const res = await request(analyticsApp)
      .get('/api/v1/analytics/metrics')
      .query({ metricId: 'mau', month, tenantId })
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const actual = res.body.data.value

    // 3. Assert within tolerance
    const delta = Math.abs(actual - expected) / expected
    expect(delta).toBeLessThanOrEqual(TOLERANCE)
    // Log for QA-00 report
    console.log(`MAU — Expected: ${expected}, Actual: ${actual}, Delta: ${(delta * 100).toFixed(2)}%`)
  })

})
```

---

## §5 · Load test pattern (k6)

```javascript
// tests/load/api-baseline.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate   = new Rate('errors')
const reqDuration = new Trend('req_duration', true)

export const options = {
  scenarios: {
    // Ramp to peak concurrent users, sustain, then ramp down
    load_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50  },   // ramp up
        { duration: '5m', target: 50  },   // sustain peak
        { duration: '2m', target: 0   },   // ramp down
      ],
    },
  },
  thresholds: {
    'req_duration': ['p(95)<300', 'p(99)<1000'],  // SLO: P95 < 300ms
    'errors':       ['rate<0.01'],                 // SLO: < 1% error rate
  },
}

const BASE_URL = __ENV.BASE_URL || 'https://staging.example.com'

export default function () {
  const token = __ENV.TEST_JWT  // pre-generated; do not auth in load test loop

  const res = http.get(`${BASE_URL}/api/v1/resources`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const ok = check(res, {
    'status 200':      r => r.status === 200,
    'has data array':  r => JSON.parse(r.body).data !== undefined,
  })

  errorRate.add(!ok)
  reqDuration.add(res.timings.duration)

  sleep(1)
}
```

---

## §6 · Bug report format (mandatory)

Every bug report filed by QA-01 must be complete and reproducible without a follow-up call.

```markdown
## Bug Report: BUG-{NNN}

**Title:** [Component] Brief description — e.g., "[Analytics] MAU chart shows 0 for Feb 29 in non-leap years"
**Severity:** P0 | P1 | P2 | P3 (per QA-00 classification)
**Reported by:** QA-01 | **Date:** YYYY-MM-DD

### Environment
- Environment: staging | dev
- Build SHA: [sha]
- Browser / OS (if UI): Chrome 121 / macOS 14 (or N/A for API)
- Tenant ID used: [id]
- User role used: [role]

### Preconditions
[Exact state the system must be in before reproducing]

### Steps to reproduce
1. Log in as [role] for tenant [id]
2. Navigate to [URL]
3. [Exact action]
4. [Exact action]

### Expected result
[What should happen — reference the Acceptance Criteria if applicable]

### Actual result
[What actually happened]

### Evidence
[Screenshot, video recording, or log excerpt — mandatory for UI bugs]
[API: paste request + response body]

### Frequency
[Always | Intermittent (N/N attempts) | Only with specific data condition]

### Suggested owner
[DEV-FE | DEV-BE | DEV-DB | DEV-DO — based on where the defect likely originates]

### Regression test
[Test ID or description of the test that should be added to prevent recurrence]
```

---

## §7 · Test execution report format

```markdown
# Test Execution Report — Sprint S-XX / Release v[X.Y.Z]
Date: YYYY-MM-DD | Author: QA-01 | Environment: staging | SHA: [sha]

## Summary
| Test type | Total | Passed | Failed | Skipped | Coverage |
|---|---|---|---|---|---|
| E2E (Playwright) | 42 | 40 | 2 | 0 | — |
| API Integration | 88 | 88 | 0 | 0 | — |
| Unit (FE — Vitest) | 310 | 310 | 0 | 0 | 83% branch |
| Unit (BE — Vitest) | 215 | 213 | 0 | 2 | 87% branch |
| Analytics accuracy | 8 KPIs | 8 | 0 | 0 | — |
| Load test | — | P95 210ms ✅ | — | — | Error rate: 0.2% ✅ |
| Accessibility (axe) | 12 pages | 12 | 0 | 0 | — |
| Multi-tenant isolation | 8 cases | 8 | 0 | 0 | — |

## Failures requiring QA-00 triage
| Bug ID | Title | Severity rec | Test file | Steps |
|---|---|---|---|---|

## Skipped tests (with justification)
| Test | Reason | Owner | Target |
|---|---|---|---|

## Coverage gaps flagged
[Areas not covered by current tests — QA-00 to decide if acceptable]
```

---

## §8 · Hard rules

- **Never close a bug without**: fix verified in the same environment it was found + regression test added (or explicitly waived by QA-00).
- **Every multi-tenant isolation test checks that the response is 404**, not 403 — confirming resource existence to a different tenant is itself a leak.
- **Analytics tests compare against source data** — visual inspection of a dashboard number is not sufficient validation.
- **Test data must not include real user PII** — use synthetic fixtures or anonymised data only.
- **Flaky tests are fixed or deleted** — a test that fails intermittently without a deterministic reason is worse than no test; it erodes trust in the entire suite.
- **Load tests do not authenticate in the test loop** — pre-generate tokens; authentication overhead skews latency measurements.
- **File a bug immediately when found** — do not batch reports at end of sprint; a P0 found on day 8 of a 10-day sprint is different from the same bug found on day 1.
- **Every failing test has an assigned bug report** — a failing test with no linked bug is invisible to the fix process.
