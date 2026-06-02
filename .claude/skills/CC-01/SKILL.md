---
name: cc-content-creation
agent: CC-01 · Content Creator
layer: L5 · Content & Communication
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: write API documentation, create a getting started guide,
  write help center articles, produce release notes, write UX microcopy, maintain an
  analytics data dictionary, write a user-facing changelog, update the internal wiki,
  or review technical writing from other agents.
reports-to: PM-01
manages: []
activation-gate: QA-00 sign-off must be issued before publishing any user-facing content for a feature
---

# Content Creation — CC-01 Skill

## Why this skill exists

Documentation is a product surface. Inaccurate API docs cause integration failures.
Ambiguous UX copy creates support tickets. An analytics metric with no plain-language
definition erodes trust in the data. This skill defines how to produce content that is
technically accurate, written for the right audience, and published at the right time.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| QA-00 release sign-off | Finalise and publish release notes + feature docs simultaneously with deployment |
| New PRD from PM-01 | Begin draft structure; identify content surfaces affected; flag missing specs |
| API contract from ARCH-BE / DEV-BE | Draft API reference documentation |
| Analytics metric definition from BA-01 | Write Data Dictionary entry |
| Architecture doc from ARCH-00 (for wiki) | Produce plain-English architecture summary |
| UX design / wireframe | Draft microcopy for all interactive elements |
| Agent-produced technical writing (runbooks, arch docs) | Review for clarity; return edits; do not rewrite without flagging to author |

**Activation gate:** Do not publish user-facing content for a feature until QA-00 sign-off is received.
Draft content in parallel with development; publish only after the gate.

---

## §1 · Writing standards

### Audience mapping (apply before writing)

| Content type | Primary audience | Reading context | Target reading level |
|---|---|---|---|
| API reference | Developer integrating the API | Focused, task-driven | Technical — precise, literal |
| Getting started | New developer | Linear, learning | Technical — clear progression |
| Help article | End user / Admin | Problem-solving | Plain language — Grade 8 or below |
| Analytics data dictionary | Power User / Executive | Reference lookup | Plain language — concise, no jargon |
| Release notes | Mixed: technical + non-technical | Scanning | Dual-layer: user benefit first, technical detail second |
| UX microcopy | End user in product | Immediate, glanceable | Ultra-plain — under 12 words where possible |
| Internal wiki | Engineering team | Deep reference | Technical — accurate, not polished |

### Voice and tone

```
✅ DO
- Lead with the user's outcome, not the feature's implementation
- Use active voice: "Click Save" not "The save operation can be initiated"
- Be specific: "Click Save changes in the top-right corner" not "Save your work"
- Define every technical term the first time it appears in user-facing content
- Error messages: tell what happened, why (if helpful), and what to do next

❌ DO NOT
- Use jargon without definition in user-facing content (API, webhook, tenant, payload — all need definitions or plain alternatives)
- Write passive voice in instructional content
- Omit the next step: "An error occurred" is never acceptable without a resolution path
- Use vague superlatives: "powerful", "seamless", "intuitive" — show, don't claim
- Copy API response field names directly into user-facing copy without translation
```

---

## §2 · API reference format (per endpoint)

Every endpoint documented must be complete. Partial docs are rejected.

```markdown
## [GET | POST | PUT | DELETE] /api/v{N}/[resource-path]

> One-sentence description of what this endpoint does and when to use it.

### Authentication
**Required:** Yes — Bearer token (JWT)
**Required roles:** `tenant-admin`, `power-user`

### Request

#### Path parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | The unique identifier of the resource |

#### Query parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `per_page` | integer | No | 25 | Results per page. Max: 100 |

#### Request body
```json
{
  "name": "string — The display name of the resource. Max 255 characters.",
  "config": {
    "enabled": "boolean — Whether the resource is active. Default: false."
  }
}
```

### Response — 200 OK
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "created_at": "ISO 8601 timestamp"
  },
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 142
  }
}
```

### Error responses
| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | The request body or parameters failed validation. Check `details` for field-level errors. |
| 401 | `UNAUTHORIZED` | Missing or expired access token. |
| 403 | `FORBIDDEN` | Valid token, but your role does not have permission for this action. |
| 404 | `NOT_FOUND` | Resource does not exist or you do not have access to it. |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests. Retry after the `Retry-After` header value (seconds). |

### Example — cURL
```bash
curl -X GET "https://api.example.com/api/v1/resources?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example — TypeScript SDK
```typescript
const { data, meta } = await client.resources.list({ page: 1, perPage: 10 })
```

### Notes
[Edge cases, deprecation notices, migration notes if applicable]
```

---

## §3 · Help article format

```markdown
# [Task-oriented title — "How to create a dashboard" not "Dashboard creation"]

> **Who this is for:** [Admin | All users | Power Users only]
> **Time to complete:** ~N minutes

## Overview
[One sentence: what the user will accomplish by following this article.]

## Before you begin
- You need [role] permissions. If you don't have access, contact your Admin.
- [Any prerequisite that must be in place]

## Steps

### 1. [Action verb + object]
[Clear, specific instruction. Screenshot if the UI action is non-obvious.]

### 2. [Action verb + object]
[Instruction.]

> **Note:** [Optional — contextual information that helps but isn't required to complete the task]

### 3. [Action verb + object]
[Instruction.]

## What happens next
[Brief description of the outcome and any follow-on steps]

## Troubleshooting
**Problem:** [Describe a common issue]
**Solution:** [Exact steps to resolve]

**Problem:** [Another common issue]
**Solution:** [Resolution]

## Related articles
- [Link: related task]
- [Link: related concept]
```

---

## §4 · Release notes format

```markdown
# Release Notes — v[X.Y.Z]
**Release date:** YYYY-MM-DD

## What's new

### [Feature name — user benefit headline]
[1–2 sentences: what changed and why it matters to the user. Lead with benefit, not implementation.]
[Screenshot or animation if the change is visual]
[Link to help article if feature requires setup]

### [Another feature]
[...]

## Improvements
- **[Component]:** [What got better and why users will notice]
- **[Component]:** [...]

## Bug fixes
- Fixed an issue where [user-observable problem]. ([Bug ID — internal, for support reference])
- Fixed [...]

## Breaking changes
> ⚠️ **Action required** — these changes may require updates to your integration.

### [Breaking change title]
[What changed, what breaks, and exactly what to do to migrate.]
**Migration guide:** [link or inline steps]
**Deprecation date (if applicable):** YYYY-MM-DD

## Known issues
- [Description of known issue] — workaround: [steps]. Expected fix: [sprint / version].

## API changes
[Table: endpoint, change type (new / modified / deprecated / removed), notes]
```

---

## §5 · UX microcopy guidelines

### Error messages (mandatory structure)

```
Structure: [What happened] + [Why, if helpful] + [What to do]

✅ Good: "Your session has expired. Sign in again to continue."
✅ Good: "We couldn't save your changes — you're offline. Check your connection and try again."
✅ Good: "The email address you entered is already in use. Sign in instead, or use a different email."

❌ Bad: "Error 401"
❌ Bad: "Something went wrong."
❌ Bad: "Invalid input." (which input? why? what's valid?)
```

### Empty states (mandatory structure)

```
Structure: [What this area shows when populated] + [Why it's empty now] + [Action to fill it]

✅ Good: "No dashboards yet. Create your first dashboard to start tracking your metrics."
         [Button: Create dashboard]

✅ Good: "No results for '[search term]'. Try a different keyword or clear your filters."
         [Button: Clear filters]

❌ Bad: "Nothing here."
❌ Bad: "No data found."
```

### Button labels

```
✅ Good: Verb + object — "Save changes", "Create dashboard", "Export as CSV", "Delete report"
❌ Bad: "Submit", "Confirm", "OK", "Yes" — always say what the button does
❌ Bad: "Click here" — describes the action, not the outcome
```

### Placeholder text in inputs

```
✅ Good: Describes expected format — "e.g. marketing@company.com"
❌ Bad: Restates the label — Input label: "Email" / Placeholder: "Enter your email"
```

---

## §6 · Analytics Data Dictionary entry format

```markdown
## [Metric Name]

**Plain-English definition:**
[One sentence a non-technical user can understand without follow-up questions.]

**Business question this answers:**
[What decision does this metric inform? e.g., "Are we retaining users month over month?"]

**Calculation:**
`COUNT(DISTINCT user_id) WHERE event_date >= [start] AND event_date < [end]`
[Or plain-language formula if no SQL is appropriate for audience]

**Dimensions available (filter by):**
- Tenant (always applied automatically)
- Date range
- Plan tier
- Region

**Data source:** events table — [system of record name]
**Refresh frequency:** Daily at 02:00 UTC (T+1)
**Known limitations:**
- Excludes users who only performed automated API actions (bot exclusion logic applied)
- Historical data available from [date] onwards

**Related metrics:** [link to related dictionary entries]
```

---

## §7 · Internal wiki article format

```markdown
# [Component / Process Name] — Internal Reference
Last updated: YYYY-MM-DD | Author: [agent] | Reviewed by: CC-01

## Purpose
[One sentence: what this component does or what this process achieves]

## Owner
Agent: [ARCH-XX or DEV-XX] | Escalation: [ARCH-00 | PM-01]

## Key facts
[Bullet list of the 5–8 most important things someone on-call needs to know]

## How it works
[Plain-English explanation — avoid reproducing the full architecture doc;
 link to the authoritative source and summarise the key points]

## Common tasks
[Links to runbooks for common operational tasks]

## Known limitations / gotchas
[Things that will surprise a newcomer]

## Links
- Architecture doc: [link]
- Runbook: [link]
- Monitoring dashboard: [link]
- Slack channel: [link]
```

---

## §8 · Content review checklist (for agent-produced technical writing)

When reviewing runbooks, architecture summaries, or technical guides from other agents:

```
□ Is the purpose of the document clear in the first two sentences?
□ Is jargon defined or replaced with plain language where the audience requires it?
□ Are steps numbered and written as "Verb + object"? (not "The system should...")
□ Are expected outcomes stated after each non-trivial step?
□ Are error conditions and recovery steps documented?
□ Is the document free of ambiguous pronouns ("it", "this", "that") without a clear referent?
□ Are commands and code blocks in code formatting (not inline prose)?
□ Is the document dated and attributed?
□ Does the document link to the authoritative source (architecture doc, ADR, runbook)?
```

Return edits as a numbered list of specific changes — not a rewritten version unless explicitly requested.

---

## §9 · Hard rules

- **Never publish user-facing content for an unverified feature** — QA-00 sign-off is the activation gate.
- **API docs must match the implemented contract exactly** — verify against DEV-BE's OpenAPI output, not the ARCH-BE draft.
- **Every breaking API change has a Migration Guide** — release notes alone are not sufficient.
- **Every error message tells the user what to do next** — "Something went wrong" is never acceptable in a shipped product.
- **Analytics metric definitions are validated against BA-01's data dictionary** — do not invent definitions; translate them.
- **Release notes are published simultaneously with the deployment** — not 48 hours later.
- **Maintain a Content Changelog**: every update to docs or release notes is logged with: date, what changed, and why.
- **Do not rewrite other agents' technical writing unilaterally** — flag clarity issues and propose specific edits; the technical author approves corrections to factual content.
