import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const FEATURES = [
  {
    title: 'AI Mock Interviews',
    description:
      'Practice with an AI interviewer that asks role-specific questions and gives instant feedback on clarity, pacing, and relevance.',
    icon: '🤖',
  },
  {
    title: 'Question Bank',
    description:
      'Browse thousands of behavioral, technical, situational, and role-specific questions filtered by level and industry.',
    icon: '📚',
  },
  {
    title: 'Score Reports',
    description:
      'Get detailed per-question breakdowns: speech rate, filler words, keyword relevance, and actionable improvement tips.',
    icon: '📊',
  },
]

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Ace Your Next Interview
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Practice AI-powered mock interviews, get scored instantly, and track your improvement
          over time — all in one platform.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8">
              Get started free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
            Everything you need to prepare
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ title, description, icon }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="mb-2 text-4xl" aria-hidden="true">{icon}</div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">Ready to start practicing?</h2>
        <p className="mt-3 text-muted-foreground">
          Create a free account and run your first mock interview in minutes.
        </p>
        <div className="mt-8">
          <Link href="/register">
            <Button size="lg" className="px-10">
              Create free account
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
