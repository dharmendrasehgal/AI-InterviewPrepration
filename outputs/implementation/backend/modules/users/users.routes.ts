import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { usersService } from './users.service'

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  target_industry: z.string().max(100).optional(),
  career_level: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  interview_track: z.enum(['behavioral', 'technical', 'situational', 'mixed']).optional(),
})

export async function usersRoutes(app: FastifyInstance) {
  // GET /users/me
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const profile = await usersService.getMe(request.user.userId)
    return reply.send({ data: profile })
  })

  // PATCH /users/me
  app.patch('/me', { preHandler: requireAuth }, async (request, reply) => {
    const dto = ProfileUpdateSchema.parse(request.body)
    const profile = await usersService.updateMe(request.user.userId, dto)
    return reply.send({ data: profile })
  })

  // POST /users/me/resume — stub upload (S3 integration)
  app.post('/me/resume', { preHandler: requireAuth }, async (request, reply) => {
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } })
    }

    // In production: stream to S3, parse with Claude
    const s3Key = `resumes/${request.user.userId}/${Date.now()}-${data.filename}`
    await usersService.saveResumeKey(request.user.userId, s3Key)

    return reply.send({
      data: {
        parsed: {
          current_role: null,
          skills: [],
          years_experience: null,
        },
        confidence_score: 0,
        requires_confirmation: true,
        message: 'Resume uploaded. AI parsing coming in Phase 2.',
      },
    })
  })

  // DELETE /users/me — account deletion request
  app.delete('/me', { preHandler: requireAuth }, async (request, reply) => {
    // Stub — full GDPR deletion deferred to Phase 3
    return reply.send({ data: { message: 'Account deletion request received. Processing within 30 days.' } })
  })
}
