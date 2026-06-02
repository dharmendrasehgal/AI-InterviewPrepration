---
name: arch-frontend-architecture
agent: ARCH-FE · Frontend Architect
layer: L2 · Architecture & Design
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: define frontend architecture, design a component system,
  set rendering strategy, specify a performance budget, design the analytics UI layer,
  define frontend CI/CD, review DEV-FE implementation approach, or evaluate a frontend library.
reports-to: ARCH-00
manages: [DEV-FE]
---

# Frontend Architecture — ARCH-FE Skill

## Why this skill exists

Frontend decisions compound quickly — a wrong rendering strategy costs months to reverse,
an uncontrolled component library becomes untestable, and analytics UIs that load
unbounded data will lock browsers at scale. This skill makes every significant frontend
decision explicit, reviewable, and reversible.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| New feature PRD from PM-01 | Assess rendering strategy, component needs, and API surface; update architecture doc |
| New API contract from ARCH-BE | Update data-fetching layer spec; brief DEV-FE on integration pattern |
| Library evaluation request | Run Library Evaluation Checklist (§4) |
| DEV-FE implementation question | Provide written guidance referencing the architecture doc |
| Performance regression reported | Run Performance Triage (§5) |
| Analytics dashboard requirement | Run Analytics UI Checklist (§3) |

---

## §1 · Rendering strategy decision matrix

Choose rendering strategy per surface type. Document in the Frontend Architecture doc.

| Surface type | Strategy | Rationale |
|---|---|---|
| Marketing / SEO pages | SSG (Static Site Generation) | Best TTFB; no runtime compute |
| Auth flows, onboarding | SSR (Server-Side Rendering) | SEO + personalisation at edge |
| App dashboard (post-login) | CSR (Client-Side Rendering) | Rich interactivity; auth gated |
| Analytics dashboards | CSR + SWR / React Query | Real-time data; user-driven queries |
| Report summary pages | ISR (Incremental Static Regen) | Semi-static; refresh on schedule |

**Rule:** Never mix SSR and CSR within the same page component tree without explicit hydration boundary documentation.

---

## §2 · Frontend Architecture Document structure

```markdown
# Frontend Architecture Document
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-FE
Reviewed by: ARCH-00 | Status: [Draft | Approved]

## 1. Framework & tooling
- Framework: Next.js 14 (App Router) + TypeScript 5 (strict)
- Bundler: Next.js built-in (Turbopack in dev)
- Styling: Tailwind CSS + CSS Modules (component-scoped)
- State: Zustand (client state) + React Query (server state)
- Testing: Vitest + React Testing Library + Playwright (E2E)
- Component docs: Storybook 8

## 2. Module structure
[Directory tree showing: app/, components/, lib/, hooks/, stores/, types/]

## 3. Rendering strategy map
[Table: route → strategy → rationale]

## 4. Component hierarchy
[Diagram: atoms → molecules → organisms → pages → layouts]

## 5. Design system
[Reference to Design System Spec document]

## 6. Data-fetching patterns
[How React Query / SWR is used; cache invalidation strategy; optimistic updates policy]

## 7. Analytics UI architecture
[Charting library; virtualization approach; streaming/polling strategy]

## 8. Performance budget
[Per-route LCP, FID, CLS targets; bundle size limits]

## 9. Accessibility standards
[WCAG 2.1 AA; testing approach; known exceptions]

## 10. CI/CD pipeline
[Build stages: type-check → lint → unit test → Storybook build → E2E → deploy]

## 11. Open decisions
[Anything not yet decided, with owner and target date]
```

---

## §3 · Analytics UI Checklist

Run for every analytics dashboard or reporting feature.

```
□ CHARTING LIBRARY — confirmed compatible with dataset size and interaction requirements?
□ VIRTUALIZATION — any table >500 rows must use windowed rendering (react-virtual / TanStack Virtual)
□ EMPTY STATES — designed for: no data, loading, error, and zero-results-for-filter states
□ EXPORT — CSV and/or PDF export scoped? (triggers backend job or client-side generation?)
□ FILTER PERFORMANCE — URL-driven filters (shareable links)? Debounced API calls?
□ REAL-TIME — polling interval defined? WebSocket or SSE if <30s refresh needed?
□ LARGE NUMBER FORMATTING — thousands separators, decimal precision, locale-aware?
□ DATA STALENESS — when was data last updated? Timestamp visible to user?
□ DRILL-DOWN — breadcrumb navigation defined for hierarchical analytics views?
□ MOBILE — analytics dashboards: is mobile a supported breakpoint? If not, document explicitly.
□ TENANT ISOLATION — all API calls include tenant context; no cross-tenant data possible client-side?
```

---

## §4 · Library Evaluation Checklist

Before adding any third-party library, complete this evaluation:

```markdown
## Library Evaluation: [library-name@version]
Date: YYYY-MM-DD | Evaluator: ARCH-FE

□ Bundle cost: [gzipped size] — within budget? [YES / NO — justify if NO]
□ Tree-shakeable: [YES / NO]
□ TypeScript support: [first-party types / @types/ / none]
□ Last release: [date] — actively maintained? [YES / NO]
□ License: [MIT / Apache2 / other] — compatible with our commercial use?
□ Security: last vulnerability scan date + result
□ SSR compatible: [YES / NO / requires workaround — document]
□ Alternative considered: [name] — reason rejected:
□ Test coverage burden: does this require test mocking infrastructure?

Decision: APPROVED | REJECTED | TRIAL (limited scope)
```

Libraries are REJECTED by default. Approval requires completing this checklist.

---

## §5 · Performance Triage Protocol

When a performance regression is reported:

**Step 1 — Measure before acting**
```bash
# In CI or locally:
npx lighthouse <url> --output json --output-path=./lh-report.json
npx bundle-analyzer   # review chunk sizes
```

**Step 2 — Classify the regression**

| Metric regressed | Likely cause | First investigation |
|---|---|---|
| LCP increased | Large image, render-blocking resource, slow server | Check image optimization, font loading, TTFB |
| CLS increased | Layout shift from async content | Add size reservations; skeleton screens |
| INP / FID increased | Heavy JS on main thread | Check event handlers, third-party scripts |
| Bundle size increased | New import, missing tree-shake | `npx source-map-explorer` on the affected chunk |
| Analytics chart render slow | Unvirtualized large dataset | Add TanStack Virtual; check data row count |

**Step 3 — Document and fix**

All performance fixes require:
- Root cause documented in PR description
- Before/after Lighthouse scores
- Regression test added (e.g., size assertion in CI)

**Rule:** A performance regression >10% on any Core Web Vital is treated as a P1 bug.

---

## §6 · Component API Contract format

Every shared component authored by DEV-FE must have a contract defined by ARCH-FE first:

```markdown
## Component: [ComponentName]
Location: components/[domain]/[ComponentName]/

### Props interface
| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| label | string | Yes | — | Visible button label |
| onClick | () => void | Yes | — | Click handler |
| disabled | boolean | No | false | Disables interaction |
| variant | 'primary' \| 'secondary' \| 'ghost' | No | 'primary' | Visual style |

### Events emitted
[Any custom events / callbacks not covered by props]

### Slots / composition
[Children patterns, compound component usage]

### Accessibility requirements
- Must be keyboard focusable
- aria-label when no visible label
- Focus ring visible in high-contrast mode

### Storybook stories required
- Default state
- Disabled state
- All variants
- Loading state (if applicable)
```

---

## §7 · Performance budget (defaults — adjust per project)

| Metric | Target | Hard limit |
|---|---|---|
| LCP | < 2.5s | < 4.0s |
| CLS | < 0.1 | < 0.25 |
| INP | < 200ms | < 500ms |
| JS bundle per route (gzipped) | < 150KB | < 250KB |
| Total page weight (gzipped) | < 500KB | < 1MB |
| Analytics table rows rendered without virtualisation | 0 (always virtualise > 200 rows) | — |

Breaching a hard limit blocks deployment. Breaching a target triggers a triage.

---

## §8 · Hard rules

- **No rendering strategy change without a documented rationale** — SSR/CSR decisions affect caching, SEO, and auth; they are not implementation details.
- **No library added without a completed Library Evaluation Checklist.**
- **Bundle size increases >10KB gzipped require ARCH-00 notification.**
- **Analytics tables rendering >200 rows must use virtualisation** — no exceptions; this is a browser stability requirement, not a preference.
- **All shared components require a Storybook story before DEV-FE considers the component done.**
- **Accessibility failures on keyboard navigation or screen reader paths are P1 bugs**, not cosmetic issues.
- **Brief DEV-FE in writing** with architecture diagram + component contracts + API integration patterns before each sprint — verbal briefings are not sufficient.
