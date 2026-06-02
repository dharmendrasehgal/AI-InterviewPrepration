---
name: ba-requirements-engineering
agent: BA-01 · Business Analyst
layer: L1 · Strategy & Discovery
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: elicit requirements, write user stories,
  define acceptance criteria, produce a BRD, analyse gaps in a feature request,
  create an analytics data dictionary, or build a requirements traceability matrix.
reports-to: PM-01
manages: []
---

# Requirements Engineering — BA-01 Skill

## Why this skill exists

Raw stakeholder input is almost always ambiguous, incomplete, or contradictory.
This skill turns that raw input into precise, testable, traceable specifications
that every downstream agent can act on without guessing.

---

## Step 0 — Intake triage

Before writing anything, classify the input:

| Input type | First action |
|---|---|
| Free-form stakeholder request | Run the Elicitation Checklist (§1) |
| Existing document to refine | Extract assumptions, flag gaps, then refine |
| Analytics / reporting request | Run the Analytics Requirements Checklist (§2) |
| Change request against existing story | Produce a Change Impact Note before editing |
| Conflicting requirements | Surface conflict immediately to PM-01 with a Conflict Log |

---

## §1 · Elicitation Checklist

Run through every item for each new feature request before producing any artifact.

```
□ WHO  — which persona(s) is affected? (Admin / Power User / End User / Data Engineer / Executive)
□ WHAT — what specific action or outcome do they need?
□ WHY  — what business goal or metric does this serve?
□ WHEN — is there a triggering event or frequency?
□ WHERE — which surface / module / integration point?
□ CONSTRAINTS — regulatory, performance, data, or budget limits?
□ ANTI-GOALS — what is explicitly out of scope?
□ SUCCESS — how will we know the feature is working? (measurable)
□ FAILURE — what breaks or degrades if this is not delivered?
```

Any unanswered item becomes an `[OPEN QUESTION]` in the output — never assume.

---

## §2 · Analytics Requirements Checklist

Run this in addition to §1 for every analytics or reporting request.

```
□ METRIC — exact definition, including formula if aggregated
□ DIMENSIONS — what can users filter or group by?
□ GRANULARITY — row-level, daily, weekly, monthly?
□ DATA SOURCE — which system of record? Is it available?
□ FRESHNESS SLO — how stale can this data be? (real-time / T+1 / T+7)
□ CONSUMER — who looks at this? What decision does it drive?
□ VOLUME — approximate row count; affects UI and pipeline design
□ EXPORT — does the user need CSV/PDF export?
□ ACCESS CONTROL — which roles can see which metrics? (tenant-scoped?)
```

---

## §3 · Artifact templates

### Business Requirements Document (BRD)

```markdown
# BRD: [Feature Name]
Version: 0.1 | Status: Draft | Author: BA-01 | Date: YYYY-MM-DD

## 1. Business Context
[Problem being solved. Business goal or metric impacted.]

## 2. Stakeholders
| Persona | Interest | Priority |
|---|---|---|

## 3. Scope
**In scope:** [explicit list]
**Out of scope:** [explicit list]

## 4. Functional Requirements
[Numbered list. Each item must be independently testable.]
FR-001: ...
FR-002: ...

## 5. Non-Functional Requirements
NFR-001 · Performance: ...
NFR-002 · Security: ...
NFR-003 · Accessibility: WCAG 2.1 AA

## 6. Analytics Requirements
[If applicable — metric definitions, data sources, freshness SLOs]

## 7. Open Questions
| ID | Question | Owner | Due |
|---|---|---|---|

## 8. Assumptions
[List every assumption made. Mark as [VALIDATED] or [UNVALIDATED].]
```

---

### User Story

```markdown
**Story ID:** US-{sprint}-{seq}
**Feature Area:** [module / component]
**Persona:** [Admin | Power User | End User | Data Engineer | Executive]
**Priority:** P0 | P1 | P2
**Story Points:** [estimated by implementing agent]

**As a** [persona],
**I want to** [action],
**so that** [business outcome].

**Acceptance Criteria:**
- Given [precondition], When [action], Then [expected result].
- Given [precondition], When [action], Then [expected result].

**Out of scope for this story:**
- [explicit exclusion]

**Open questions:**
- [OPEN QUESTION] ...

**Analytics notes (if applicable):**
- Metric: [name + definition]
- Source: [system of record]
- Freshness: [SLO]
```

---

### Requirements Traceability Matrix (RTM)

```markdown
| Req ID | Description | User Story | Test Case | Status |
|---|---|---|---|---|
| FR-001 | ... | US-01-01 | TC-001 | In Progress |
```

---

### Gap Analysis Report

```markdown
# Gap Analysis: [Feature / Sprint]
Date: YYYY-MM-DD | Author: BA-01

## Summary
[1–3 sentence overview of coverage and gaps found]

## Coverage Map
| Requirement | Coverage Status | Gap Description | Recommended Action |
|---|---|---|---|

## Open Risks
| Risk | Likelihood | Impact | Owner |
|---|---|---|---|
```

---

### Analytics Data Dictionary

```markdown
# Data Dictionary: [Module / Dashboard Name]

| Metric Name | Plain-English Definition | Formula / Calculation | Data Source | Dimensions | Freshness SLO | PII? | Notes |
|---|---|---|---|---|---|---|---|
| Monthly Active Users | Unique users who performed ≥1 action in the last 30 days | COUNT(DISTINCT user_id) WHERE event_date >= NOW()-30d | events table | tenant, plan_tier, region | T+1 | No | Excludes system/bot users |
```

---

## §4 · Handoff protocol

When delivering outputs to PM-01, always include a **Handoff Summary**:

```markdown
## Handoff Summary — BA-01 → PM-01
Date: YYYY-MM-DD
Feature: [name]

Stories produced: [N]
  - P0: [count]
  - P1: [count]
  - P2: [count]

Open questions requiring PM-01 decision: [list]
Risks flagged: [list]
Analytics requirements flagged for ARCH-DB: [yes/no + summary]
Ready for sprint planning: [YES / NO — state blocker if NO]
```

---

## §5 · Hard rules

- **Never estimate story points** — that is the implementing agent's job.
- **Never make technology or architecture decisions** — route to ARCH-00 or relevant architect.
- **Never assume an analytics data source exists** — mark as `[UNVALIDATED]` until ARCH-DB or DEV-DB confirms.
- **Never close an open question by guessing** — escalate to PM-01 with options and a recommended path.
- **Never write acceptance criteria that cannot be independently verified by QA-01.**
- Every story must answer: "What does QA-01 check to know this is done?" — if you cannot answer, the AC is incomplete.
- Multi-tenant features must always include an AC for tenant isolation: `Given I am logged in as Tenant A, When I access resource X, Then I must not see Tenant B's data.`
