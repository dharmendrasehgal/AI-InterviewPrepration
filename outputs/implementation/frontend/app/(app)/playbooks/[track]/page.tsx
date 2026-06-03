'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { playbooksApi, type ExpertTrack } from '@/lib/api/client'
import { PlaybookReader } from '@/components/playbooks/PlaybookReader'
import { Skeleton } from '@/components/ui/skeleton'

export default function PlaybookDetailPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = React.use(params)

  const { data: playbook, isLoading, isError } = useQuery({
    queryKey: ['playbook', track],
    queryFn: () => playbooksApi.get(track as ExpertTrack),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 flex gap-8">
        <div className="w-52 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (isError || !playbook) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Playbook not found.</p>
        <Link href="/playbooks" className="mt-4 inline-block text-sm text-primary underline">
          Back to Playbooks
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link href="/playbooks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Playbooks
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{playbook.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Version {playbook.version}</p>
      </div>
      <PlaybookReader playbook={playbook} />
    </div>
  )
}
