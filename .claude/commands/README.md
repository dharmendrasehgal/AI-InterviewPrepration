# Agent Pipeline — Interview Preparation Platform

## Overview

This directory contains all Claude Code agents for the Interview Preparation Platform SDLC pipeline.
Agents are invoked via `/agent-name` in Claude Code or spawned programmatically via the `agent` tool.

---

## Pipeline Architecture

```
Requirements         Architecture (Skills)      Implementation (Agents)
─────────────        ─────────────────────      ──────────────────────────────
requirement_agent → /ARCH-00 senior          → backend_developer_agent
                  → /ARCH-BE backend             ├─ auth_module_agent
                  → /ARCH-FE frontend            ├─ questions_module_agent
                  → /ARCH-DB database            ├─ mock_sessions_module_agent
                  → /ARCH-DO devops             └─ feedback_module_agent
                                              → frontend_developer_agent

Quality (Skills)     Release
────────────────     ────────
/QA-00 lead       → release_management_agent
/QA-01 developer
build_intelligence_agent  (runs on any build failure)
```

---

## The 5 Reliability Rules (read before invoking any agent)

### Rule 1 — Read DECISIONS.md first
Every agent reads `.claude/commands/DECISIONS.md` before doing any work.
It contains all architecture decisions that are final for Phase 1.
Do not re-derive or re-debate them.

### Rule 2 — Scope agents narrowly
Prefer module-specific agents over broad phase agents:
- `auth_module_agent` instead of `backend_developer_agent` for auth work
- Each module agent owns exactly one set of files — no cross-module edits

### Rule 3 — Verify before completing
Every code-writing agent runs `npx tsc --noEmit` before declaring success.
If TypeScript errors exist, fix them first.

### Rule 4 — Write handoff summaries
On completion, every agent writes:
```
outputs/.agent-handoffs/<agent-name>.md
```
Use the template in `DECISIONS.md`. The next agent reads this before starting.

### Rule 5 — Write checkpoint markers
On successful completion, every agent writes:
```
outputs/.agent-checkpoints/<agent-name>.done
```
The orchestrator checks for this file. If absent, the task did not complete.

---

## Agent Index

### Requirements & Planning
| Agent | File | Purpose |
|-------|------|---------|
| requirement_agent | `requirement_agent.agent.md` | Gather and structure requirements |

### Architecture — invoke as Skills (`/ARCH-*`)
| Skill ID | Purpose |
|----------|---------|
| `ARCH-00` | Enterprise architecture governance |
| `ARCH-BE` | Backend API and service design |
| `ARCH-FE` | UI architecture and component design |
| `ARCH-DB` | Data modelling and migration strategy |
| `ARCH-DO` | Infrastructure and CI/CD design |

### Implementation — Backend (narrow-scope first)
| Agent | File | Purpose |
|-------|------|---------|
| auth_module_agent | `auth_module_agent.agent.md` | Auth routes, service, JWT, refresh tokens |
| questions_module_agent | `questions_module_agent.agent.md` | Questions CRUD, search, bookmarks |
| mock_sessions_module_agent | `mock_sessions_module_agent.agent.md` | Session flow, S3 upload, scoring queue |
| feedback_module_agent | `feedback_module_agent.agent.md` | Feedback list, recording URLs |
| backend_developer_agent | `backend_developer_agent.agent.md` | Multi-module tasks only (3+ modules) |

### Implementation — Frontend & Infrastructure
| Agent / Skill | File / ID | Purpose |
|---------------|-----------|---------|
| frontend_developer_agent | `frontend_developer_agent.agent.md` | Next.js UI and API integration |
| DEV-DO skill | `/DEV-DO` | Docker, CI/CD, infrastructure |
| DEV-DB skill | `/DEV-DB` | Migrations and seed scripts |

### Quality & Release
| Agent / Skill | File / ID | Purpose |
|---------------|-----------|---------|
| build_intelligence_agent | `build_intelligence_agent.agent.md` | Build error triage and fix routing |
| release_management_agent | `release_management.agent.md` | Release gates and deployment |
| QA Lead | `/QA-00` skill | Test strategy and coverage planning |
| QA Developer | `/QA-01` skill | Test automation |

---

## Checkpoint & Handoff Directories

```
outputs/
  .agent-checkpoints/    # <agent-name>.done markers
  .agent-handoffs/       # <agent-name>.md summaries
  build-reports/         # build_intelligence_agent gap reports
  requirements/          # requirement_agent outputs
  implementation/        # all code
```

---

## Common Invocation Patterns

### Fix a single backend module
```
/auth_module_agent Fix the refresh token rotation logic
```

### Triage a build failure
```
/build_intelligence_agent [paste raw build output here]
```

### Architecture review
```
/ARCH-BE Review the auth service design
/ARCH-00 Approve the Phase 2 microservices proposal
```

### Start from scratch after architecture is approved
```
1. /DEV-DB                   → creates migrations and schema
2. /auth_module_agent        → auth module
3. /questions_module_agent   → questions module
4. /mock_sessions_module_agent → mock sessions
5. /feedback_module_agent    → feedback module
6. /frontend_developer_agent → all frontend
7. /QA-01                    → tests
```
