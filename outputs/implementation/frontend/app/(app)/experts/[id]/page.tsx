'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { expertsApi, bookingsApi, type AvailabilitySlot } from '@/lib/api/client'
import { useBookingStore } from '@/lib/store/booking'
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

const TRACK_LABELS: Record<string, string> = {
  general_career: 'General Career',
  software_engineering: 'Software Engineering',
  medical: 'Medical / Residency',
}

function formatRate(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)} / 50 min`
}

export default function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const { selectedSlotId, setSelectedSlot, clearSelection } = useBookingStore()
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  const { data: expert, isLoading } = useQuery({
    queryKey: ['expert', id],
    queryFn: () => expertsApi.get(id),
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['availability', id],
    queryFn: () => expertsApi.listAvailability(id, { available_only: true }),
    enabled: !!expert,
  })

  function handleSelectSlot(slot: AvailabilitySlot) {
    if (expert) {
      setSelectedSlot(expert.expert_id, slot.slot_id, slot.start_at, slot.end_at)
    }
  }

  async function handleBook() {
    if (!selectedSlotId || !expert) return
    setBookingError(null)
    setIsBooking(true)
    try {
      const booking = await bookingsApi.create({ expert_id: expert.expert_id, availability_id: selectedSlotId })
      clearSelection()
      router.push(`/account/bookings?booked=${booking.booking_id}`)
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  if (!expert) {
    return <p className="py-16 text-center text-muted-foreground">Expert not found.</p>
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 -ml-2">
          ← Back
        </Button>
        <h1 className="text-2xl font-bold">{expert.headline}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{TRACK_LABELS[expert.track] ?? expert.track}</Badge>
          <span>·</span>
          <span>{expert.years_exp} years experience</span>
          <span>·</span>
          <span className="font-medium text-foreground">{formatRate(expert.rate_cents)}</span>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{expert.bio}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Available Sessions</CardTitle></CardHeader>
        <CardContent>
          {bookingError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}
          <AvailabilityCalendar slots={slots} selectedSlotId={selectedSlotId} onSelect={handleSelectSlot} />
          {selectedSlotId && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleBook} disabled={isBooking} size="lg">
                {isBooking ? 'Booking…' : 'Confirm Booking'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
