# AI Agent Skills — Index
**Domain:** SaaS / Web Application + Analytics
**Total agents:** 14 | **Layers:** 5

## Quick reference

| Skill File | Agent | Layer | Reports To | Manages |
|---|---|---|---|---|
| BA-01/SKILL.md | Business Analyst | L1 · Strategy | PM-01 | — |
| PM-01/SKILL.md | Product Manager | L1 · Strategy | Stakeholders | BA-01, ARCH-00, QA-00, CC-01 |
| ARCH-00/SKILL.md | Senior Architect | L2 · Architecture | PM-01 | ARCH-FE, ARCH-BE, ARCH-DB, ARCH-DO |
| ARCH-FE/SKILL.md | Frontend Architect | L2 · Architecture | ARCH-00 | DEV-FE |
| ARCH-BE/SKILL.md | Backend Architect | L2 · Architecture | ARCH-00 | DEV-BE |
| ARCH-DB/SKILL.md | DB Architect | L2 · Architecture | ARCH-00 | DEV-DB |
| ARCH-DO/SKILL.md | DevOps Architect | L2 · Architecture | ARCH-00 | DEV-DO |
| DEV-FE/SKILL.md | Frontend Developer | L3 · Engineering | ARCH-FE | — |
| DEV-BE/SKILL.md | Backend Developer | L3 · Engineering | ARCH-BE | — |
| DEV-DB/SKILL.md | DB Developer | L3 · Engineering | ARCH-DB | — |
| DEV-DO/SKILL.md | DevOps Developer | L3 · Engineering | ARCH-DO | — |
| QA-00/SKILL.md | QA Lead | L4 · Quality | PM-01 | QA-01 |
| QA-01/SKILL.md | QA Developer | L4 · Quality | QA-00 | — |
| CC-01/SKILL.md | Content Creator | L5 · Content | PM-01 | — |

## What each skill file contains

Every SKILL.md follows the same structure:
- **YAML frontmatter**: name, agent ID, layer, domain, triggers, reporting line
- **Step 0 — Intake triage**: decision table for routing inputs correctly
- **Numbered sections (§1–§N)**: procedures, templates, checklists, and patterns
- **Hard rules**: non-negotiable constraints enforced in every task

## How to use

1. Load the skill file into the agent's context at the start of each session.
2. The agent reads Step 0 first to classify the incoming request.
3. The agent follows the relevant section(s) for the task type.
4. The agent applies the Hard Rules section as constraints on all output.

## Skill section reference

| Agent | Key sections |
|---|---|
| BA-01 | §1 Elicitation checklist · §2 Analytics requirements checklist · §3 Artifact templates (BRD, User Story, RTM, Gap Analysis, Data Dictionary) · §4 Handoff protocol |
| PM-01 | §1 RICE/MoSCoW prioritisation · §2 PRD template · §3 Trade-off analysis · §4 Sprint Brief/Status/Retro templates · §5 Release Gate Checklist · §6 Orchestration rules |
| ARCH-00 | §1 ADR format · §2 Cross-cutting standards · §3 Architecture Review Protocol · §4 Arbitration Protocol · §5 Technology Radar · §6 Risk Register · §7 SAD structure |
| ARCH-FE | §1 Rendering strategy matrix · §2 Architecture doc structure · §3 Analytics UI checklist · §4 Library evaluation checklist · §5 Performance triage · §6 Component API contracts · §7 Performance budget |
| ARCH-BE | §1 API contract format · §2 Service boundary framework · §3 Auth blueprint · §4 Analytics query architecture · §5 Performance triage · §6 Integration evaluation · §7 Resilience patterns |
| ARCH-DB | §1 Technology selection · §2 Multi-tenancy model · §3 Data model standards · §4 ERD document format · §5 Analytics dimensional model · §6 Migration strategy · §7 Data governance policy |
| ARCH-DO | §1 Infrastructure architecture doc · §2 IaC standards · §3 CI/CD pipeline spec · §4 SLO definition format · §5 Cost triage · §6 Observability standards · §7 DR plan |
| DEV-FE | §1 Implementation checklist · §2 Component patterns · §3 Analytics component patterns · §4 Testing patterns · §5 PR description format |
| DEV-BE | §1 Implementation checklist · §2 Service layer patterns · §3 Analytics endpoint patterns · §4 Testing patterns · §5 PR description format |
| DEV-DB | §1 Migration checklist · §2 Migration file format · §3 Zero-downtime patterns · §4 RLS implementation · §5 Analytics pipeline patterns · §6 Query optimisation · §7 Seed data · §8 Data quality validation |
| DEV-DO | §1 IaC module checklist · §2 Terraform module structure · §3 CI/CD pipeline patterns · §4 Monitoring/alerting config · §5 Secrets management · §6 Runbook format · §7 Analytics cluster config |
| QA-00 | §1 Test strategy structure · §2 Defect triage (P0–P3 classification) · §3 Regression test plan · §4 Release Gate Checklist · §5 Analytics Validation Report · §6 Multi-tenant isolation test cases |
| QA-01 | §1 Test implementation checklist · §2 E2E test patterns (Playwright) · §3 API integration test patterns · §4 Analytics accuracy test · §5 Load test pattern (k6) · §6 Bug report format · §7 Test execution report |
| CC-01 | §1 Writing standards + audience mapping · §2 API reference format · §3 Help article format · §4 Release notes format · §5 UX microcopy guidelines · §6 Data dictionary entry · §7 Internal wiki format · §8 Content review checklist |
