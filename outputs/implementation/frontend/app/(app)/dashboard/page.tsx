'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { feedbackApi, type FeedbackEntry } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Shared helpers ───────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>
  const variant = score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'destructive'
  return <Badge variant={variant}>{score}</Badge>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

// ─── Candidate dashboard ──────────────────────────────────────────

function CandidateDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['feedback', 'list'],
    queryFn: () => feedbackApi.list(),
  })

  const sessions = data?.items ?? []
  const scored = sessions.filter((s) => s.composite_score !== null)
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((sum, s) => sum + (s.composite_score ?? 0), 0) / scored.length)
      : null
  const bestScore = scored.length > 0 ? Math.max(...scored.map((s) => s.composite_score ?? 0)) : null

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/mock-session">
          <Button size="lg">Start AI Mock Interview</Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : (
          <>
            <StatCard label="Total Sessions" value={sessions.length} />
            <StatCard label="Average Score" value={avgScore ?? '—'} />
            <StatCard label="Best Score" value={bestScore ?? '—'} />
          </>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Sessions</h2>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Failed to load sessions. Please refresh.</p>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
            <p className="text-4xl" aria-hidden="true">🎤</p>
            <p className="text-lg font-medium">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Start your first AI mock interview to see your scores here.
            </p>
            <Link href="/mock-session">
              <Button>Start your first session</Button>
            </Link>
          </div>
        )}

        {!isLoading && sessions.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((session: FeedbackEntry) => (
                  <tr key={session.session_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(session.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={session.type === 'ai_mock' ? 'default' : 'secondary'}>
                        {session.type === 'ai_mock' ? 'AI' : 'Live'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={session.composite_score} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/feedback/${session.session_id}`}
                        className="text-primary underline underline-offset-4 hover:no-underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Expert dashboard ─────────────────────────────────────────────

function ExpertDashboard() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expert Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conduct live mock interviews and help candidates prepare.
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Question Bank</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Browse and filter the full question library to prepare for sessions.
            </p>
            <Link href="/questions">
              <Button variant="outline" className="w-full">Browse Questions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Live Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scheduling and live session management are coming in Phase 2.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Candidate Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              View and submit structured feedback for candidates you've interviewed.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Phase 2 roadmap notice */}
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-2xl mb-2" aria-hidden="true">🚀</p>
        <p className="font-medium">Expert features are expanding in Phase 2</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Live session scheduling, candidate progress tracking, earnings dashboard, and feedback
          templates will be available in the next release.
        </p>
      </div>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  return user?.role === 'expert' ? <ExpertDashboard /> : <CandidateDashboard />
}
