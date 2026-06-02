'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { mockSessionsApi, type ScoreReport } from '@/lib/api/client'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-200'
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function QuestionBreakdown({
  index,
  entry,
}: {
  index: number
  entry: ScoreReport['per_question'][number]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
        aria-expanded={open}
      >
        <span className="font-medium">Question {index + 1}</span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs font-semibold',
              scoreBadgeClass(entry.clarity_score),
            )}
          >
            Clarity {entry.clarity_score}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Clarity progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Clarity Score</span>
              <span>{entry.clarity_score} / 100</span>
            </div>
            <Progress value={entry.clarity_score} />
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 rounded-md bg-muted/40 p-3">
            <div className="text-center">
              <p className="text-lg font-bold">{entry.speech_rate_wpm}</p>
              <p className="text-xs text-muted-foreground">WPM</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{entry.filler_word_count}</p>
              <p className="text-xs text-muted-foreground">Filler words</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{Math.round(entry.keyword_relevance * 100)}%</p>
              <p className="text-xs text-muted-foreground">Keyword relevance</p>
            </div>
          </div>

          {/* Improvement tip */}
          {entry.improvement_tip && (
            <Alert>
              <AlertDescription>
                <strong>Tip:</strong> {entry.improvement_tip}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}

function ScoreReportView({ report }: { report: ScoreReport }) {
  return (
    <div className="space-y-8">
      {/* Big score */}
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <p className="mb-1 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Overall Clarity Score
          </p>
          <p
            className={cn(
              'text-7xl font-bold',
              report.composite_score >= 70
                ? 'text-green-600'
                : report.composite_score >= 50
                ? 'text-yellow-600'
                : 'text-red-600',
            )}
          >
            {report.composite_score}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">out of 100</p>
        </CardContent>
      </Card>

      {/* Session summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatItem
              label="Avg WPM"
              value={report.session_summary.avg_speech_rate_wpm}
            />
            <StatItem
              label="Total filler words"
              value={report.session_summary.total_filler_words}
            />
            <StatItem
              label="Avg keyword relevance"
              value={`${Math.round(report.session_summary.avg_keyword_relevance * 100)}%`}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Per-Question Breakdown</h2>
        {report.per_question.map((entry, i) => (
          <QuestionBreakdown key={entry.question_id} index={i} entry={entry} />
        ))}
      </div>

      <div className="pt-2">
        <Link href="/feedback">
          <Button variant="outline">Back to Feedback Archive</Button>
        </Link>
      </div>
    </div>
  )
}

export default function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = React.use(params)

  const { data, isError } = useQuery({
    queryKey: ['score', sessionId],
    queryFn: () => mockSessionsApi.getScore(sessionId),
    refetchInterval: (query) => {
      const d = query.state.data
      if (d && !('status' in d)) return false // got real score — stop polling
      return 5000 // poll every 5s while processing
    },
  })

  const isProcessing = !data || ('status' in data && data.status === 'processing')

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Score Report</h1>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load score report. Please refresh the page.</AlertDescription>
        </Alert>
      )}

      {isProcessing && !isError && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            Generating your score report…
          </p>
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      )}

      {!isProcessing && data && !('status' in data) && (
        <ScoreReportView report={data} />
      )}
    </div>
  )
}
