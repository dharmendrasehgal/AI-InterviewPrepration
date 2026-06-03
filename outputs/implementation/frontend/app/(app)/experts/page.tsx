'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { expertsApi, type ExpertTrack } from '@/lib/api/client'
import { ExpertCard } from '@/components/experts/ExpertCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const TRACKS: { value: ExpertTrack | ''; label: string }[] = [
  { value: '', label: 'All tracks' },
  { value: 'general_career', label: 'General Career' },
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'medical', label: 'Medical / Residency' },
]

export default function ExpertsMarketplacePage() {
  const [track, setTrack] = useState<ExpertTrack | ''>('')
  const [maxRate, setMaxRate] = useState<number | undefined>()
  const [cursor, setCursor] = useState<string | undefined>()
  const [allExperts, setAllExperts] = useState<ReturnType<typeof Array.prototype.map> extends (infer T)[] ? T[] : never[]>([])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['experts', 'list', { track, maxRate, cursor }],
    queryFn: async () => {
      const res = await expertsApi.list({
        track: track || undefined,
        max_rate_cents: maxRate,
        cursor,
        page_size: 12,
      })
      setAllExperts((prev) => cursor ? [...prev, ...res.items] : res.items)
      return res
    },
  })

  function handleFilterChange() {
    setCursor(undefined)
    setAllExperts([])
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Expert Marketplace</h1>
        <p className="mt-1 text-muted-foreground">
          Book a live 1-on-1 mock interview with a verified industry professional.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={track}
          onChange={(e) => { setTrack(e.target.value as ExpertTrack | ''); handleFilterChange() }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Filter by track"
        >
          {TRACKS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          onChange={(e) => { setMaxRate(e.target.value ? Number(e.target.value) : undefined); handleFilterChange() }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Filter by max rate"
        >
          <option value="">Any rate</option>
          <option value="5000">Up to $50</option>
          <option value="7500">Up to $75</option>
          <option value="10000">Up to $100</option>
        </select>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load experts. Please refresh.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && !cursor
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
          : allExperts.map((expert) => <ExpertCard key={expert.expert_id} expert={expert} />)
        }
      </div>

      {data?.has_more && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setCursor(data.next_cursor ?? undefined)}>
            Load more
          </Button>
        </div>
      )}

      {!isLoading && allExperts.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">
          No experts match your filters — try broadening your search.
        </p>
      )}
    </div>
  )
}
