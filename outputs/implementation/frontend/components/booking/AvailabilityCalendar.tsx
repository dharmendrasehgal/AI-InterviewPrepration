'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AvailabilitySlot } from '@/lib/api/client'

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[]
  selectedSlotId: string | null
  onSelect: (slot: AvailabilitySlot) => void
}

function formatSlot(slot: AvailabilitySlot): string {
  const start = new Date(slot.start_at)
  const end = new Date(slot.end_at)
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const startTime = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${startTime} – ${endTime}`
}

export function AvailabilityCalendar({ slots, selectedSlotId, onSelect }: AvailabilityCalendarProps) {
  const available = slots.filter((s) => !s.is_booked)

  if (available.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No available slots — check back later or contact the expert.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {available.map((slot) => {
        const isSelected = slot.slot_id === selectedSlotId
        return (
          <div
            key={slot.slot_id}
            className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
              isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
            }`}
          >
            <span className="text-sm">{formatSlot(slot)}</span>
            <div className="flex items-center gap-2">
              {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
              <Button
                size="sm"
                variant={isSelected ? 'secondary' : 'outline'}
                onClick={() => onSelect(slot)}
              >
                {isSelected ? 'Selected' : 'Book'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
