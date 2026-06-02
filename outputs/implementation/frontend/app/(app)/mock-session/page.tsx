'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { mockSessionsApi, ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function MockSessionSetupPage() {
  const router = useRouter()
  const [track, setTrack] = useState('general_career')
  const [level, setLevel] = useState('mid')
  const [questionCount, setQuestionCount] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await mockSessionsApi.create({
        track,
        level,
        question_count: questionCount,
      })
      router.push(`/mock-session/${session.session_id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create session. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Start an AI Mock Interview</CardTitle>
          <CardDescription>
            Choose your track, level, and number of questions, then begin when ready.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="track">Track</Label>
              <select
                id="track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="general_career">General Career</option>
                <option value="software_engineering">Software Engineering</option>
                <option value="medical_residency">Medical / Residency</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of questions</Label>
              <select
                id="questionCount"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={3}>3 questions (~10 min)</option>
                <option value={5}>5 questions (~15 min)</option>
                <option value={7}>7 questions (~20 min)</option>
                <option value={10}>10 questions (~30 min)</option>
              </select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading} aria-busy={loading}>
              {loading ? 'Creating session…' : 'Start Session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
