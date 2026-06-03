import { z } from 'zod'

const TRACKS = ['general_career', 'software_engineering', 'medical'] as const

export const RegisterExpertSchema = z.object({
  headline: z.string().min(10).max(150),
  bio: z.string().min(50).max(2000),
  industry: z.enum(TRACKS),
  track: z.enum(TRACKS),
  years_exp: z.number().int().min(1).max(50),
  rate_cents: z.number().int().min(0).max(100_000),
})

export const UpdateExpertSchema = z.object({
  headline: z.string().min(10).max(150).optional(),
  bio: z.string().min(50).max(2000).optional(),
  years_exp: z.number().int().min(1).max(50).optional(),
  rate_cents: z.number().int().min(0).max(100_000).optional(),
})

export const ListExpertsQuerySchema = z.object({
  track: z.enum(TRACKS).optional(),
  industry: z.enum(TRACKS).optional(),
  max_rate_cents: z.coerce.number().int().min(0).optional(),
  cursor: z.string().optional(),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
})

export type RegisterExpertDto = z.infer<typeof RegisterExpertSchema>
export type UpdateExpertDto = z.infer<typeof UpdateExpertSchema>
export type ListExpertsQuery = z.infer<typeof ListExpertsQuerySchema>
