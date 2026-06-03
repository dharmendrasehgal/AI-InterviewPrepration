'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi, type Booking } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

const STATUS_BADGE: Record<Booking['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmed', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'outline' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function MyBookingsPage() {
  const searchParams = useSearchParams()
  const justBooked = searchParams.get('booked')
  const queryClient = useQueryClient()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.list,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      setCancellingId(null)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
    onError: (err: unknown) => {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed')
    },
  })

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Bookings</h1>

      {justBooked && (
        <Alert className="mb-6">
          <AlertDescription>
            Booking confirmed! You will receive a reminder email 24 hours before your session.
          </AlertDescription>
        </Alert>
      )}

      {cancelError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{cancelError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
          <p className="text-4xl" aria-hidden="true">📅</p>
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="text-sm text-muted-foreground">Browse the Expert Marketplace to book your first session.</p>
          <Link href="/experts">
            <Button>Browse Experts</Button>
          </Link>
        </div>
      )}

      {!isLoading && bookings.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((booking) => {
                const badge = STATUS_BADGE[booking.status]
                return (
                  <tr key={booking.booking_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(booking.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                          <>
                            <Link href={`/sessions/live/${booking.booking_id}`}>
                              <Button size="sm">Join</Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={cancelMutation.isPending && cancellingId === booking.booking_id}
                              onClick={() => {
                                setCancellingId(booking.booking_id)
                                setCancelError(null)
                                cancelMutation.mutate(booking.booking_id)
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'completed' && (
                          <Link href={`/sessions/live/${booking.booking_id}`}>
                            <Button size="sm" variant="outline">View Rubric</Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
