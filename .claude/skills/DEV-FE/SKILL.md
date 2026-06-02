---
name: dev-frontend-implementation
agent: DEV-FE · Frontend Developer
layer: L3 · Engineering & Implementation
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: implement a UI component, build a page or route,
  integrate a frontend with a backend API, write frontend tests, build an analytics
  dashboard component, optimise bundle size, fix a UI bug, or write Storybook stories.
reports-to: ARCH-FE
manages: []
---

# Frontend Implementation — DEV-FE Skill

## Why this skill exists

Frontend implementation quality directly determines user experience, product
performance, and QA throughput. This skill defines the exact procedure for
turning an ARCH-FE architecture spec into production-ready, tested, accessible,
and performant UI code.

---

## Step 0 — Before writing any code

Confirm you have all required inputs. Block and escalate to ARCH-FE if any are missing.

```
□ Frontend Architecture Document reviewed (current version)
□ Component API contracts for all shared components involved
□ API contract from ARCH-BE for every endpoint this feature calls
□ Design specification or wireframe for every screen
□ Acceptance Criteria from BA-01 for every story in scope
□ Performance budget for affected routes confirmed
```

If an API contract is missing: do not mock an assumption — open a question to ARCH-FE/ARCH-BE and block the story.

---

## §1 · Implementation checklist (per story)

Work through in order. Do not mark a story done until every box is checked.

```
□ Component scaffolded following ARCH-FE module structure
□ TypeScript strict mode — no `any` without documented justification
□ Design tokens used (Tailwind classes / CSS variables) — no hardcoded colours or sizes
□ All async states handled: loading skeleton, error boundary, empty state
□ API integration matches ARCH-BE contract exactly (method, path, auth header, schema)
□ Tenant context passed correctly — verify from ARCH-BE contract, not assumed
□ Unit tests written: ≥80% branch coverage on component logic
□ Integration test written for the primary user flow (happy path + one error path)
□ Storybook story added: default + all variant states
□ Accessibility checked: keyboard navigation, focus ring, aria attributes
□ Bundle impact assessed — run `next build` and compare chunk sizes
□ Performance budget not exceeded — verify with Lighthouse if LCP-sensitive route
□ PR description complete (see §5)
```

---

## §2 · Component implementation patterns

### Standard component file structure

```typescript
// components/[domain]/[ComponentName]/[ComponentName].tsx

import { type FC } from 'react'

// 1. Type definitions — props interface before component
interface ComponentNameProps {
  /** Primary label displayed to the user */
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

// 2. Component — functional, typed, no default exports in shared components
export const ComponentName: FC<ComponentNameProps> = ({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
}) => {
  // 3. Hooks first, grouped by type
  // 4. Derived state
  // 5. Handlers
  // 6. JSX — no inline styles; design tokens only
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={/* Tailwind classes from design system */}
    >
      {label}
    </button>
  )
}
```

### API integration pattern (React Query)

```typescript
// hooks/use[Resource].ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Resource } from '@/types/api'

// Query keys as constants — prevents typos, enables targeted invalidation
export const RESOURCE_KEYS = {
  all: ['resources'] as const,
  list: (filters: ResourceFilters) => ['resources', 'list', filters] as const,
  detail: (id: string) => ['resources', 'detail', id] as const,
}

export function useResources(filters: ResourceFilters) {
  return useQuery({
    queryKey: RESOURCE_KEYS.list(filters),
    queryFn: () => apiClient.get<Resource[]>('/api/v1/resources', { params: filters }),
    staleTime: 60_000,        // 60s before background refetch
    retry: 2,
    // Handle loading, error, empty in the component — do not throw from hook
  })
}
```

### Async state handling (mandatory pattern)

Every data-dependent component must handle all four states:

```tsx
function ResourceList() {
  const { data, isLoading, isError, error } = useResources(filters)

  if (isLoading) return <ResourceListSkeleton />          // ← skeleton, not spinner (prevents CLS)
  if (isError) return <ErrorBoundary error={error} />     // ← error boundary, not console.error
  if (!data || data.length === 0) return <EmptyState      // ← empty state, not null
    title="No resources yet"
    description="Create your first resource to get started."
    action={<CreateResourceButton />}
  />

  return <ul>{data.map(r => <ResourceRow key={r.id} resource={r} />)}</ul>
}
```

---

## §3 · Analytics component patterns

### Table virtualisation (mandatory for >200 rows)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function AnalyticsTable({ rows }: { rows: Row[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // row height in px
    overscan: 10,
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{ position: 'absolute', top: virtualRow.start, height: virtualRow.size, width: '100%' }}
          >
            <TableRow row={rows[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Chart empty / loading / error states

```tsx
function MetricChart({ tenantId, metricId, dateRange }: MetricChartProps) {
  const { data, isLoading, isError } = useMetric({ tenantId, metricId, dateRange })

  return (
    <ChartContainer title="Monthly Active Users">
      {isLoading && <ChartSkeleton />}
      {isError && <ChartError message="Could not load metric. Try refreshing." />}
      {data && data.points.length === 0 && (
        <ChartEmpty message="No data for the selected period." />
      )}
      {data && data.points.length > 0 && (
        <LineChart data={data.points} /* ... */ />
      )}
    </ChartContainer>
  )
}
```

### Data staleness indicator

Analytics dashboards must always display when data was last updated:

```tsx
<span className="text-xs text-muted-foreground">
  Data as of {formatDistanceToNow(new Date(data.refreshedAt), { addSuffix: true })}
</span>
```

---

## §4 · Testing patterns

### Unit test (Vitest + React Testing Library)

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders label and triggers onClick', () => {
    const onClick = vi.fn()
    render(<ComponentName label="Save changes" onClick={onClick} />)

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables the button when disabled prop is true', () => {
    render(<ComponentName label="Save" onClick={vi.fn()} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  // Test all variants, error states, empty states
})
```

### Accessibility check (mandatory before PR)

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<ComponentName label="Save" onClick={vi.fn()} />)
  expect(await axe(container)).toHaveNoViolations()
})
```

---

## §5 · PR description format (mandatory)

```markdown
## Summary
[One sentence: what feature or fix does this PR deliver?]

## Story / ticket
[US-XX-YY] [Link]

## Changes
- [List of meaningful changes — not a git log]

## API integration
- Endpoint(s) used: [METHOD /api/v1/...]
- Auth: [JWT / public]
- Deviation from contract: [NONE | describe if any — flag to ARCH-FE]

## Testing
- Unit tests: [added / updated — N new tests]
- Integration tests: [added / updated]
- Storybook: [stories added / updated]

## Performance
- Bundle delta: [+NKB / -NKB / no change] on [route name]
- Lighthouse: [score if LCP-sensitive route]
- Virtualisation: [used / not needed — row count: N]

## Accessibility
- Keyboard navigation: [tested — PASS / FAIL with detail]
- Screen reader: [tested with VoiceOver/NVDA — PASS / SKIP with justification]
- axe automated check: [PASS / N violations — detail]

## Screenshots / recordings
[For any visible UI change]
```

---

## §6 · Hard rules

- **TypeScript strict mode — no `any`** without a comment explaining why and a tracking issue to remove it.
- **No inline styles** — design tokens (Tailwind classes or CSS variables) only.
- **All four async states handled** — a component that renders `null` on error or empty is a bug.
- **No API calls to undocumented endpoints** — if ARCH-BE's contract doesn't describe it, escalate before calling it.
- **Analytics tables >200 rows must use virtualisation** — a 10,000-row table without virtualisation is a browser crash waiting to happen.
- **Never assume tenant context** — always derive it from the auth token via the approved pattern.
- **Shared components require Storybook stories** — a component without a story cannot be visually reviewed or reused confidently.
- **Accessibility failures on keyboard navigation are P1 bugs** — do not merge a PR that cannot be used without a mouse.
