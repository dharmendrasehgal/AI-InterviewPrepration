import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireExpert } from '@/lib/auth-middleware'
import { SubmitRubricSchema } from './rubric.schema'
import { rubricService } from './rubric.service'

export async function rubricRoutes(app: FastifyInstance) {
  // POST /rubric/:expertSessionId — expert submits rubric after session
  app.post('/:expertSessionId', { preHandler: requireExpert }, async (request, reply) => {
    const { expertSessionId } = z.object({ expertSessionId: z.string().uuid() }).parse(request.params)
    const dto = SubmitRubricSchema.parse(request.body)
    const result = await rubricService.submit(expertSessionId, request.user.userId, dto)
    return reply.status(201).send({ data: result })
  })

  // GET /rubric/:expertSessionId — candidate or expert retrieves the rubric
  app.get('/:expertSessionId', { preHandler: requireAuth }, async (request, reply) => {
    const { expertSessionId } = z.object({ expertSessionId: z.string().uuid() }).parse(request.params)
    const result = await rubricService.get(expertSessionId, request.user.userId)
    return reply.send({ data: result })
  })
}
