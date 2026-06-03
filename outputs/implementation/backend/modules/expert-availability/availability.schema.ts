import { z } from 'zod'

export const CreateSlotSchema = z.object({
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
}).refine(
  (d) => new Date(d.end_at).getTime() - new Date(d.start_at).getTime() >= 50 * 60 * 1000,
  { message: 'Slot must be at least 50 minutes long', path: ['end_at'] },
).refine(
  (d) => new Date(d.start_at) > new Date(),
  { message: 'Slot must be in the future', path: ['start_at'] },
)

export const ListAvailabilityQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  available_only: z.coerce.boolean().default(false),
})

export type CreateSlotDto = z.infer<typeof CreateSlotSchema>
export type ListAvailabilityQuery = z.infer<typeof ListAvailabilityQuerySchema>
