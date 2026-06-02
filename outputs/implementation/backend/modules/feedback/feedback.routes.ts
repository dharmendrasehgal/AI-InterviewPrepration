import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { feedbackService } from './feedback.service'

const ListQuerySchema = z.object({
  type: z.enum(['ai_mock', 'live_human', 'all']).optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  score_min: z.coerce.number().int().min(0).max(100).optional(),
  score_max: z.coerce.number().int().min(0).max(100).optional(),
  cursor: z.string().optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
})

export async function feedbackRoutes(app: FastifyInstance) {
  // GET /feedback
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const filter = ListQuerySchema.parse(request.query)
    const result = await feedbackService.list(request.user.userId, filter)
    return reply.send({
      data: result.items,
      meta: {
        next_cursor: result.next_cursor,
        has_more: result.has_more,
        total: result.total,
      },
    })
  })

  // GET /feedback/:sessionId/recording
  app.get('/:sessionId/recording', { preHandler: requireAuth }, async (request, reply) => {
    const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(request.params)
    const result = await feedbackService.getRecordingUrl(sessionId, request.user.userId)
    return reply.send({ data: result })
  })
}
