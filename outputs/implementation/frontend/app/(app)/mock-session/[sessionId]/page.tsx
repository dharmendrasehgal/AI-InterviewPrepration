'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { mockSessionsApi, type SessionQuestion } from '@/lib/api/client'
import { useSessionRecording } from '@/hooks/use-session-recording'
import { ConsentDialog } from '@/components/session/ConsentDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Step = 'consent' | 'camera_check' | 'question' | 'uploading' | 'complete'

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function MockSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = React.use(params)
  const router = useRouter()

  const [step, setStep] = useState<Step>('consent')
  const [question, setQuestion] = useState<SessionQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const {
    state: recordingState,
    durationMs,
    error: recordingError,
    requestPermissions,
    start,
    stop,
    reset,
  } = useSessionRecording()

  const ready = recordingState === 'ready'
  const recording = recordingState === 'recording'

  const handleDecline = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleAccept = useCallback(async () => {
    setSessionError(null)
    try {
      await mockSessionsApi.recordConsent(sessionId)
      setStep('camera_check')
      const ok = await requestPermissions()
      if (!ok) return

      const q = await mockSessionsApi.getNextQuestion(sessionId)
      setQuestion(q)
      setQuestionIndex(0)
      setStep('question')
    } catch {
      setSessionError('Failed to start session. Please try again.')
      setStep('consent')
    }
  }, [sessionId, requestPermissions])

  const handleStopAndUpload = useCallback(async () => {
    const blob = await stop()
    if (!blob || !question) return

    setStep('uploading')

    try {
      await mockSessionsApi.uploadResponse(sessionId, question.id, question.response_index, blob)
    } catch {
      setSessionError('Upload failed. Please try again.')
      setStep('question')
      return
    }

    reset()

    try {
      const nextQ = await mockSessionsApi.getNextQuestion(sessionId)
      setQuestion(nextQ)
      setQuestionIndex((i) => i + 1)
      setStep('question')
    } catch {
      // No more questions — session complete
      try {
        await mockSessionsApi.complete(sessionId)
      } catch {
        // best-effort complete
      }
      setStep('complete')
      // Small delay so user sees "complete" state before redirect
      setTimeout(() => {
        router.push(`/feedback/${sessionId}`)
      }, 2000)
    }
  }, [stop, question, sessionId, reset, router])

  // ── Consent step ──────────────────────────────────────────────
  if (step === 'consent') {
    return (
      <>
        {sessionError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert variant="destructive">
              <AlertDescription>{sessionError}</AlertDescription>
            </Alert>
          </div>
        )}
        <ConsentDialog
          sessionType="ai_mock"
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </>
    )
  }

  // ── Camera check step ─────────────────────────────────────────
  if (step === 'camera_check') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          role="status"
          aria-label="Checking camera"
        />
        <p className="text-lg font-medium">Checking camera and microphone…</p>
        {recordingError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{recordingError}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // ── Uploading step ────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
        <p className="text-muted-foreground">Uploading your response…</p>
        {sessionError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{sessionError}</AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  // ── Complete step ─────────────────────────────────────────────
  if (step === 'complete') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl" aria-hidden="true">✅</p>
        <h2 className="text-2xl font-bold">Session complete!</h2>
        <p className="text-muted-foreground">Generating your score report… redirecting shortly.</p>
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" role="status" aria-label="Redirecting" />
      </div>
    )
  }

  // ── Question step ─────────────────────────────────────────────
  const questionNumber = questionIndex + 1
  const totalLabel = totalQuestions ? `of ${totalQuestions}` : ''

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {sessionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{sessionError}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {questionNumber} {totalLabel}
        </p>
        {recording && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" aria-hidden="true" />
            Recording — {formatMs(durationMs)}
          </span>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {question?.text ?? <Skeleton className="h-6 w-full" />}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STAR tip */}
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <strong>Tip:</strong> Use the <strong>STAR method</strong> — describe the{' '}
            <em>Situation</em>, <em>Task</em>, <em>Action</em>, and <em>Result</em>.
          </div>

          {question?.framework && (
            <Badge variant="outline">Framework: {question.framework}</Badge>
          )}

          {/* Timer display when not recording */}
          {!recording && recordingState === 'ready' && (
            <p className="text-sm text-muted-foreground">Ready to record when you are.</p>
          )}
          {!ready && !recording && (
            <p className="text-sm text-muted-foreground capitalize">Camera: {recordingState}</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {!recording && (
          <Button
            onClick={start}
            disabled={!ready}
            size="lg"
            className="flex-1"
            aria-disabled={!ready}
          >
            Start Recording
          </Button>
        )}

        {recording && (
          <Button
            onClick={handleStopAndUpload}
            variant="destructive"
            size="lg"
            className="flex-1"
          >
            Stop &amp; Submit
          </Button>
        )}
      </div>
    </div>
  )
}
