import { create } from 'zustand'

interface BookingState {
  selectedExpertId: string | null
  selectedSlotId: string | null
  selectedSlotStart: string | null
  selectedSlotEnd: string | null
  setSelectedSlot: (expertId: string, slotId: string, start: string, end: string) => void
  clearSelection: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedExpertId: null,
  selectedSlotId: null,
  selectedSlotStart: null,
  selectedSlotEnd: null,
  setSelectedSlot: (expertId, slotId, start, end) =>
    set({ selectedExpertId: expertId, selectedSlotId: slotId, selectedSlotStart: start, selectedSlotEnd: end }),
  clearSelection: () =>
    set({ selectedExpertId: null, selectedSlotId: null, selectedSlotStart: null, selectedSlotEnd: null }),
}))
