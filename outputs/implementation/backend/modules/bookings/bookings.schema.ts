import { z } from 'zod'

export const CreateBookingSchema = z.object({
  expert_id: z.string().uuid(),
  availability_id: z.string().uuid(),
})

export const CancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
})

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>
export type CancelBookingDto = z.infer<typeof CancelBookingSchema>
