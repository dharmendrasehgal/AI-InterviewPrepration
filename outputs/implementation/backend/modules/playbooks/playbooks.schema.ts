import { z } from 'zod'

const TRACKS = ['general_career', 'software_engineering', 'medical'] as const

const SectionSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  questions: z.array(z.string()).default([]),
})

export const UpdatePlaybookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sections: z.array(SectionSchema).min(1).optional(),
})

export const CreatePlaybookSchema = z.object({
  track: z.enum(TRACKS),
  title: z.string().min(1).max(200),
  sections: z.array(SectionSchema).min(1),
})

export type UpdatePlaybookDto = z.infer<typeof UpdatePlaybookSchema>
export type CreatePlaybookDto = z.infer<typeof CreatePlaybookSchema>
