import { z } from 'zod'

const score = z.number().int().min(1).max(5)

export const SubmitRubricSchema = z.object({
  communication: score,
  technical_depth: score,
  structured_thinking: score,
  confidence: score,
  feedback_text: z.string().min(20).max(3000),
  notes: z.string().max(1000).optional(),
})

export type SubmitRubricDto = z.infer<typeof SubmitRubricSchema>
