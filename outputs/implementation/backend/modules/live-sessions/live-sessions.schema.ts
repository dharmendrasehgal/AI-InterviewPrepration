import { z } from 'zod'

export const CompleteSessionSchema = z.object({
  duration_seconds: z.number().int().min(1).optional(),
})

export type CompleteSessionDto = z.infer<typeof CompleteSessionSchema>
