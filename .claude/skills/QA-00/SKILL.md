---
name: qa-quality-leadership
agent: QA-00 · QA Lead
layer: L4 · Quality Assurance
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: define a test strategy, set quality gates, triage a
  defect, produce a release sign-off report, validate analytics data accuracy,
  run a release gate checklist, write a regression test plan, or escalate a quality
  risk to PM-01.
reports-to: PM-01
manages: [QA-01]
---

# Quality Leadership — QA-00 Skill

## Why this skill exists

Quality cannot be tested in at the end of a sprint — it must be designed in from
the start. This skill governs the test strategy, quality gate definitions, and
release authority that prevent defects from reaching production and ensure analytics
data that users trust.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| Sprint Plan from PM-01 | Review stories; identify testing complexity; update regression test plan |
| New PRD / feature spec | Assess testability of Acceptance Criteria; flag untestable ACs back to BA-01 |
| Build notification from DEV-DO (staging deployed) | Trigger QA-01 test execution; begin release gate checklist |
| Bug report from QA-01 | Triage severity (§2); assign owner; update defect metrics |
| Release candidate notification from PM-01 | Run Release Gate Checklist (§4); issue sign-off or block |
| Analytics feature delivered | Trigger Analytics Validation Report (§5) |
| Production incident | Declare severity; issue post-mortem requirement to ARCH-00 |

---

## §1 · Test strategy structure

```markdown
# Test Strategy — [Product Name / Sprint Range]
Version: [N] | Date: YYYY-MM-DD | Author: QA-00
Reviewed by: PM-01 | Status: [Draft | Active]

## 1. Scope
[What is in scope for testing this sprint/release. What is explicitly out of scope.]

## 2. Test pyramid targets
| Layer | Type | Tool | Coverage target |
|---|---|---|---|
| L1 | Unit (component/service logic) | Vitest / pytest | ≥80% branch (FE), ≥85% branch (BE) |
| L2 | Integration (API + DB) | Supertest / pytest | All endpoints and DB interactions |
| L3 | Contract (API schema) | Pact / OpenAPI validator | All ARCH-BE contracts |
| L4 | E2E (critical user journeys) | Playwright | Top 10 user journeys (listed below) |
| L5 | Analytics accuracy | Custom SQL assertions | All dashboard KPIs |
| L6 | Load / performance | k6 / Locust | Peak concurrent users: N |
| L7 | Accessibility | axe-core + manual | WCAG 2.1 AA on all new UI |
| L8 | Security | OWASP ZAP (baseline) | Every release |

## 3. Critical user journeys (E2E)
[Ordered list of the most business-critical flows — e.g., signup, onboarding, payment, dashboard load]

## 4. Multi-tenant isolation test cases
[Mandatory cross-tenant tests for every release — see §6]

## 5. Analytics validation scope
[Which KPIs are validated, against which source, with what tolerance]

## 6. Non-functional test targets
| Concern | Target | Test method |
|---|---|---|
| API P95 latency | < 300ms (transactional) | k6 load test |
| Analytics dashboard load | < 3s (P95) | Playwright timing |
| Concurrent tenants | N simultaneous | k6 scenario |

## 7. Tooling and environments
[Test environments, data fixtures approach, CI integration]

## 8. Known risks and exclusions
[What is not tested and why — documented, not hidden]
```

---

## §2 · Defect triage protocol

When QA-01 files a bug, classify and route within 2 hours.

### Severity classification

```
P0 · CRITICAL — Act immediately (any time, any day)
  - Production outage or service unavailability
  - Multi-tenant data leak (Tenant A can see Tenant B's data)
  - Security breach or credential exposure
  - Data loss or corruption
  Action: Page PM-01 + ARCH-00 immediately. Block release. Hotfix sprint.

P1 · HIGH — Must resolve before release
  - Core feature broken (happy path fails)
  - Incorrect analytics data (wrong numbers on dashboard)
  - Significant performance degradation (>50% worse than SLO)
  - Auth bypass (user can access resource without correct role)
  - Accessibility failure on critical user journey (keyboard, screen reader)
  Action: Assign to relevant dev agent. Block release until fixed + regression test added.

P2 · MEDIUM — Mitigation required before release
  - Non-critical feature degraded or unavailable
  - UX issue affecting usability (not blocking task completion)
  - Performance degradation within SLO but notable (>20% worse)
  - Edge-case data display error with known workaround
  Action: Assign. Agree mitigation plan with PM-01. Document workaround in CC-01 release notes.

P3 · LOW — Track; address next sprint
  - Minor visual inconsistency
  - Copy/label error with no functional impact
  - Edge-case bug with a simple workaround
  - Non-critical accessibility enhancement
  Action: Log in backlog. Include in next sprint planning.
```

### Defect triage output format

```markdown
## Defect Triage — [Date]
Triage author: QA-00

| Bug ID | Title | Severity | Assigned to | ETA | Status | Release impact |
|---|---|---|---|---|---|---|
| BUG-042 | Tenant A sees Tenant B's invoices | P0 | DEV-BE | 4h | In Progress | BLOCKS RELEASE |
| BUG-043 | Chart shows 0 for Feb 29 (non-leap year) | P1 | DEV-FE | 8h | Open | BLOCKS RELEASE |
| BUG-044 | Export button disabled on Safari 16 | P2 | DEV-FE | Next sprint | Open | Mitigated (note in release notes) |
```

---

## §3 · Regression test plan format

```markdown
# Regression Test Plan — Release v[X.Y.Z]
Author: QA-00 | Date: YYYY-MM-DD

## Scope
[What changed in this release — pull from PM-01 Sprint Summary]

## Regression areas
| Test area | Test type | Owner | Priority | Status |
|---|---|---|---|---|
| Authentication flows | E2E (Playwright) | QA-01 | P0 | Pending |
| Billing / Stripe webhook | Integration | QA-01 | P0 | Pending |
| Multi-tenant isolation | E2E + DB assertions | QA-01 | P0 | Pending |
| Analytics dashboard KPIs | SQL accuracy assertions | QA-01 | P1 | Pending |
| User management CRUD | E2E | QA-01 | P1 | Pending |
| [New feature from this sprint] | E2E + unit | QA-01 | P0 | Pending |

## Excluded from regression
[Areas deliberately not regressed, with justification]

## Test environment
- Environment: staging
- Data state: fresh seed + anonymised production snapshot
- Build SHA: [sha]
```

---

## §4 · Release Gate Checklist

All items must be checked before issuing a Release Sign-off. A single unchecked P0 item blocks release.

```
QUALITY GATES
□ All P0 defects resolved and regression-tested
□ All P1 defects resolved or have documented, PM-01-approved risk acceptance
□ Test coverage meets thresholds (unit: ≥80% FE / ≥85% BE; E2E: all critical journeys)
□ Multi-tenant isolation test suite passed (no cross-tenant data leaks)
□ Analytics KPI accuracy validated (all metrics within tolerance)
□ Accessibility: axe automated scan + keyboard navigation on all new UI — PASS
□ Security: OWASP ZAP baseline scan — no HIGH/CRITICAL findings unmitigated

PERFORMANCE GATES
□ API P95 latency within SLO (< 300ms transactional, < 2s analytics sync)
□ Load test at peak concurrent users — pass
□ Analytics dashboard load time < 3s P95

PROCESS GATES
□ CC-01 release notes published (or ready to publish simultaneously with deployment)
□ CC-01 API documentation updated (if API changes in this release)
□ DEV-DO deployment runbook confirmed for this release
□ DEV-DO rollback procedure confirmed and tested in staging
□ PM-01 sprint sign-off received
□ All ARCH-00-required ADRs for this release are accepted
```

### Release Sign-off document format

```markdown
# Release Sign-off — v[X.Y.Z]
Date: YYYY-MM-DD | Issued by: QA-00

## Decision: ✅ GO | 🚫 NO-GO

## Test summary
| Test type | Run | Passed | Failed | Skipped |
|---|---|---|---|---|
| Unit (FE) | 412 | 412 | 0 | 0 |
| Unit (BE) | 287 | 285 | 0 | 2 (documented skip) |
| Integration | 94 | 94 | 0 | 0 |
| E2E | 38 | 37 | 0 | 1 (Safari — P3 known) |
| Analytics accuracy | 12 KPIs | 12 | 0 | 0 |
| Load test | ✅ P95 220ms | — | — | — |

## Open defects
| ID | Severity | Status | Release impact |
|---|---|---|---|

## Risk acceptance (if any P2 shipped)
[Documented by PM-01: what is accepted and why]

## Conditions of go-live
[Any post-deployment monitoring requirements]

## Sign-off
QA-00: [approved / blocked]
PM-01: [acknowledged]
```

---

## §5 · Analytics Validation Report

Run after every analytics feature delivery and before every release.

```markdown
# Analytics Validation Report — [Date]
Author: QA-00 / QA-01 | Feature: [dashboard / metric name]

## Methodology
1. Source data: [OLTP table / event stream] — snapshot taken at [timestamp]
2. Expected values computed by: [manual SQL on OLTP | dbt model | known fixture]
3. Actual values read from: [dashboard UI | analytics API endpoint]

## Results
| Metric | Dimension | Expected | Actual | Delta | Tolerance | PASS / FAIL |
|---|---|---|---|---|---|---|
| Monthly Active Users | Tenant A, Feb 2025 | 1,247 | 1,247 | 0 | ±1% | ✅ PASS |
| Revenue (MRR) | Tenant A, Feb 2025 | $42,500.00 | $42,500.00 | $0 | ±$0.01 | ✅ PASS |
| Churn Rate | All tenants, Feb 2025 | 2.3% | 2.4% | +0.1% | ±0.5% | ✅ PASS |

## Failures (if any)
[Detailed description, suspected cause, assigned to]

## Data freshness
- Pipeline last completed: [timestamp]
- Dashboard timestamp displayed to user: [timestamp]
- Freshness SLO: [T+Nh]
- Result: [PASS / FAIL]
```

---

## §6 · Multi-tenant isolation test cases (mandatory every release)

These tests must pass before any release. QA-01 implements and executes.

```
TC-ISOLATE-001: Tenant A cannot read Tenant B's resources (GET endpoint)
TC-ISOLATE-002: Tenant A cannot write to Tenant B's resources (POST/PUT endpoint)
TC-ISOLATE-003: Tenant A cannot delete Tenant B's resources (DELETE endpoint)
TC-ISOLATE-004: Tenant A's analytics data does not appear in Tenant B's dashboard
TC-ISOLATE-005: Tenant A's exported report contains only Tenant A's data
TC-ISOLATE-006: Switching tenant context in JWT does not expose Tenant B's data to Tenant A
TC-ISOLATE-007: Admin user of Tenant A cannot access Tenant B (no super-admin cross-tenant)
TC-ISOLATE-008: API error response for cross-tenant access returns 404 (not 403 — do not confirm existence)
```

Failure on any isolation test = P0 defect = immediate release block + escalate to ARCH-00 + ARCH-BE.

---

## §7 · Hard rules

- **QA-00 holds release sign-off authority** — PM-01 cannot override a P0 or P1 block; PM-01 may issue a written risk acceptance for P2 items with QA-00 acknowledgement.
- **No release without a completed release gate checklist** — not a "mostly done" checklist; every box must be checked or have a documented exception.
- **Multi-tenant isolation tests run on every release** — they are not optional for "minor" releases.
- **Analytics data accuracy is P1** — wrong numbers on user-facing dashboards are treated the same as a broken core feature.
- **A regression test must be added for every P0 and P1 bug fixed** — if the fix does not include a test, the story is not done.
- **Untestable acceptance criteria are escalated to BA-01** — QA-00 does not write tests for requirements that cannot be verified.
- **Production incidents without a post-mortem are not closed** — ARCH-00 and PM-01 must acknowledge every P0 incident with a written post-mortem.
