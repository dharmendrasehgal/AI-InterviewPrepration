'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expertsApi } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState } from 'react'

export default function AdminExpertsPage() {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['admin', 'experts', 'pending'],
    queryFn: expertsApi.listPending,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => expertsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'experts'] }),
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'Action failed'),
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => expertsApi.suspend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'experts'] }),
    onError: (err: unknown) => setActionError(err instanceof Error ? err.message : 'Action failed'),
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Expert Applications</h1>
      <p className="mb-6 text-sm text-muted-foreground">Review and approve pending expert applications.</p>

      {actionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      )}

      {!isLoading && pending.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No pending applications.</p>
      )}

      {!isLoading && pending.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applicant</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Track</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applied</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pending.map((expert) => (
                <tr key={expert.expert_id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{expert.headline}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{expert.track}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(expert.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setActionError(null); approveMutation.mutate(expert.expert_id) }}
                        disabled={approveMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setActionError(null); suspendMutation.mutate(expert.expert_id) }}
                        disabled={suspendMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
