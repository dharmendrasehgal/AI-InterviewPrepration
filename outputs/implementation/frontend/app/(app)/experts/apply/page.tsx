'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { expertsApi, type ExpertTrack, ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const TRACKS: { value: ExpertTrack; label: string }[] = [
  { value: 'general_career', label: 'General Career' },
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'medical', label: 'Medical / Residency' },
]

export default function ExpertApplyPage() {
  const router = useRouter()
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [track, setTrack] = useState<ExpertTrack>('general_career')
  const [yearsExp, setYearsExp] = useState(1)
  const [rateUsd, setRateUsd] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await expertsApi.register({
        headline,
        bio,
        industry: track,
        track,
        years_exp: yearsExp,
        rate_cents: rateUsd * 100,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Application submitted!</CardTitle>
            <CardDescription>
              Our team will review your profile within 2–5 business days. You will receive an email when approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Apply as an Expert</CardTitle>
          <CardDescription>
            Complete your expert profile. Our team reviews all applications before going live.
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
              <Label htmlFor="headline">Professional headline</Label>
              <Input
                id="headline"
                required
                minLength={10}
                maxLength={150}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior SWE @ Google, 8 years"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                required
                minLength={50}
                maxLength={2000}
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell candidates about your background and how you help them prepare…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="track">Specialisation track</Label>
              <select
                id="track"
                value={track}
                onChange={(e) => setTrack(e.target.value as ExpertTrack)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TRACKS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExp">Years of experience</Label>
              <Input
                id="yearsExp"
                type="number"
                min={1}
                max={50}
                required
                value={yearsExp}
                onChange={(e) => setYearsExp(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Session rate (USD per 50 min)</Label>
              <Input
                id="rate"
                type="number"
                min={0}
                max={1000}
                required
                value={rateUsd}
                onChange={(e) => setRateUsd(Number(e.target.value))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit for Review'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
