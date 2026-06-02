'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { feedbackApi, type FeedbackEntry } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-200'
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function FeedbackListPage() {
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['feedback', 'list', typeFilter, dateFrom],
    queryFn: () =>
      feedbackApi.list({
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
      }),
  })

  const sessions = data?.items ?? []

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Feedback Archive</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by session type"
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All types</option>
          <option value="ai_mock">AI Mock</option>
          <option value="live_human">Live</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Filter from date"
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load sessions. Please refresh.</p>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">📂</p>
          <p className="text-lg font-medium">No sessions found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete a mock interview to see your reports here.
          </p>
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session: FeedbackEntry) => (
            <Card key={session.session_id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{formatDate(session.created_at)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={session.type === 'ai_mock' ? 'default' : 'secondary'}>
                      {session.type === 'ai_mock' ? 'AI Mock' : 'Live'}
                    </Badge>
                    {session.expert_name && (
                      <span className="text-xs text-muted-foreground">with {session.expert_name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {session.composite_score !== null ? (
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        scoreBadgeClass(session.composite_score),
                      )}
                    >
                      {session.composite_score}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Processing…</span>
                  )}

                  <Link
                    href={`/feedback/${session.session_id}`}
                    className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
                  >
                    View Report
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
