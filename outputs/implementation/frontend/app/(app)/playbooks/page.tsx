'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { playbooksApi, type ExpertTrack } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const TRACK_META: Record<ExpertTrack, { emoji: string; description: string }> = {
  general_career: {
    emoji: '💼',
    description: 'Interview fundamentals, STAR method, salary negotiation, and universal frameworks.',
  },
  software_engineering: {
    emoji: '💻',
    description: 'System design, algorithms, behavioural at tech companies, and coding culture.',
  },
  medical: {
    emoji: '🏥',
    description: 'MMI stations, ethical scenarios, clinical case structure, and residency preparation.',
  },
}

export default function PlaybooksIndexPage() {
  const { data: playbooks = [], isLoading, isError } = useQuery({
    queryKey: ['playbooks'],
    queryFn: playbooksApi.list,
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Industry Playbooks</h1>
        <p className="mt-1 text-muted-foreground">
          Structured preparation guides written by industry professionals.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load playbooks. Please refresh.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)
          : playbooks.map((pb) => {
              const meta = TRACK_META[pb.track as ExpertTrack]
              return (
                <Card key={pb.playbook_id} className="flex flex-col">
                  <CardHeader>
                    <div className="mb-2 text-4xl" aria-hidden="true">{meta?.emoji}</div>
                    <CardTitle className="text-xl">{pb.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <CardDescription className="flex-1 text-sm leading-relaxed">
                      {meta?.description}
                    </CardDescription>
                    <Link href={`/playbooks/${pb.track}`}>
                      <Button variant="outline" className="w-full">Open Playbook →</Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })
        }
      </div>
    </div>
  )
}
