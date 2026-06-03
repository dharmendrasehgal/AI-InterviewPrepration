'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { liveSessionsApi, rubricApi } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth'
import { LiveSessionRoom } from '@/components/session/LiveSessionRoom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

type PageStep = 'consent' | 'session' | 'rubric' | 'done'

function ScorePicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`h-10 w-10 rounded-full border text-sm font-semibold transition-colors ${
              value === n ? 'border-primary bg-primary text-primary-foreground' : 'border-input hover:bg-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LiveSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = React.use(params)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const role = user?.role === 'expert' ? 'expert' : 'candidate'

  const [step, setStep] = useState<PageStep>('consent')
  const [rubricScores, setRubricScores] = useState({ communication: 3, technical_depth: 3, structured_thinking: 3, confidence: 3 })
  const [feedbackText, setFeedbackText] = useState('')
  const [rubricError, setRubricError] = useState<string | null>(null)

  const { data: session, isLoading } = useQuery({
    queryKey: ['live-session', sessionId],
    queryFn: () => liveSessionsApi.get(sessionId),
  })

  const consentMutation = useMutation({
    mutationFn: () => liveSessionsApi.recordConsent(sessionId),
    onSuccess: () => setStep('session'),
  })

  const startMutation = useMutation({
    mutationFn: () => liveSessionsApi.start(sessionId),
  })

  const completeMutation = useMutation({
    mutationFn: () => liveSessionsApi.complete(sessionId),
    onSuccess: () => {
      if (role === 'expert') setStep('rubric')
      else setStep('done')
    },
  })

  const rubricMutation = useMutation({
    mutationFn: () => rubricApi.submit(sessionId, { ...rubricScores, feedback_text: feedbackText }),
    onSuccess: () => setStep('done'),
    onError: (err: unknown) => setRubricError(err instanceof Error ? err.message : 'Failed to submit rubric'),
  })

  const handleEnd = useCallback(() => {
    completeMutation.mutate()
  }, [completeMutation])

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!session) {
    return <p className="py-16 text-center text-muted-foreground">Session not found.</p>
  }

  // Consent step
  if (step === 'consent') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recording Consent Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This live session will be recorded for your Feedback Archive. Both participants must consent before the session begins.
            </p>
            {consentMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>Failed to record consent. Please try again.</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Decline
              </Button>
              <Button
                onClick={() => consentMutation.mutate()}
                disabled={consentMutation.isPending}
                className="flex-1"
              >
                {consentMutation.isPending ? 'Recording consent…' : 'Accept & Join'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Live session room
  if (step === 'session') {
    if (role === 'expert' && !startMutation.isSuccess) {
      startMutation.mutate()
    }
    return (
      <LiveSessionRoom
        sessionId={sessionId}
        role={role}
        peerName={role === 'expert' ? 'Candidate' : 'Expert'}
        onEnd={handleEnd}
      />
    )
  }

  // Expert rubric submission step
  if (step === 'rubric') {
    const overall = Object.values(rubricScores).reduce((a, b) => a + b, 0) / 4
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Submit Evaluation</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); rubricMutation.mutate() }}
          className="space-y-6"
        >
          {rubricError && (
            <Alert variant="destructive">
              <AlertDescription>{rubricError}</AlertDescription>
            </Alert>
          )}

          <ScorePicker label="Communication Clarity" value={rubricScores.communication} onChange={(v) => setRubricScores((s) => ({ ...s, communication: v }))} />
          <ScorePicker label="Technical Depth" value={rubricScores.technical_depth} onChange={(v) => setRubricScores((s) => ({ ...s, technical_depth: v }))} />
          <ScorePicker label="Structured Thinking" value={rubricScores.structured_thinking} onChange={(v) => setRubricScores((s) => ({ ...s, structured_thinking: v }))} />
          <ScorePicker label="Confidence" value={rubricScores.confidence} onChange={(v) => setRubricScores((s) => ({ ...s, confidence: v }))} />

          <p className="text-sm text-muted-foreground">Overall score (auto-computed): <strong>{overall.toFixed(1)} / 5.0</strong></p>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback for candidate (required)</Label>
            <Textarea
              id="feedback"
              required
              minLength={20}
              rows={5}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share specific observations and actionable suggestions…"
            />
          </div>

          <Button type="submit" className="w-full" disabled={rubricMutation.isPending}>
            {rubricMutation.isPending ? 'Submitting…' : 'Submit Evaluation'}
          </Button>
        </form>
      </div>
    )
  }

  // Done
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-5xl" aria-hidden="true">✅</p>
      <h2 className="text-2xl font-bold">Session complete</h2>
      <p className="text-muted-foreground">
        {role === 'expert'
          ? 'Your evaluation has been submitted. Thank you!'
          : 'Your session has been saved to your Feedback Archive.'}
      </p>
      <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
    </div>
  )
}
