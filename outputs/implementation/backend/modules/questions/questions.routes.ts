import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '@/lib/auth-middleware'
import { verifyAccessToken } from '@/modules/auth/auth.service'
import { questionsService } from './questions.service'

const ListQuerySchema = z.object({
  type: z.enum(['behavioral', 'technical', 'situational', 'role_specific']).optional(),
  level: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  industry: z.string().max(100).optional(),
  tag: z.string().max(100).optional(),
  cursor: z.string().optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
})

export async function questionsRoutes(app: FastifyInstance) {
  // GET /questions/search — must be registered before /questions/:id
  app.get('/search', async (request, reply) => {
    const { q, suggest } = z
      .object({ q: z.string().min(1).max(200), suggest: z.coerce.boolean().optional() })
      .parse(request.query)

    const result = await questionsService.search(q, suggest ?? false)
    return reply.send({ data: result })
  })

  // GET /questions/bookmarked
  app.get('/bookmarked', { preHandler: requireAuth }, async (request, reply) => {
    const results = await questionsService.getBookmarked(request.user.userId)
    return reply.send({ data: results })
  })

  // GET /questions
  app.get('/', async (request, reply) => {
    const filter = ListQuerySchema.parse(request.query)

    // Extract optional userId from Bearer token without requiring auth
    let userId: string | undefined
    const header = request.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        // verifyAccessToken imported statically above
        const payload = verifyAccessToken(header.slice(7))
        userId = payload.sub
      } catch {
        // anonymous request — no bookmarks
      }
    }

    const result = await questionsService.list({ ...filter, userId })
    return reply.send({
      data: {
        items: result.items,
        next_cursor: result.next_cursor,
        has_more: result.has_more,
        total: result.total,
      },
    })
  })

  // GET /questions/:id
  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

    let userId: string | undefined
    const header = request.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        // verifyAccessToken imported statically above
        const payload = verifyAccessToken(header.slice(7))
        userId = payload.sub
      } catch { /* anonymous */ }
    }

    const question = await questionsService.get(id, userId)
    return reply.send({ data: question })
  })

  // POST /questions/:id/bookmark
  app.post('/:id/bookmark', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    await questionsService.bookmark(request.user.userId, id)
    return reply.status(204).send()
  })

  // DELETE /questions/:id/bookmark
  app.delete('/:id/bookmark', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    await questionsService.unbookmark(request.user.userId, id)
    return reply.status(204).send()
  })

  // ─── Admin question management ─────────────────────────────────

  const AdminQuestionSchema = z.object({
    text: z.string().min(10).max(1000),
    type: z.enum(['behavioral', 'technical', 'situational', 'role_specific']),
    level: z.enum(['entry', 'mid', 'senior', 'executive']),
    industry: z.string().max(100).default('general'),
    difficulty: z.number().int().min(1).max(5).default(3),
    tags: z.array(z.string()).default([]),
    framework: z.string().optional(),
    answer: z.string().min(10).optional(),
    keywords: z.array(z.string()).default([]),
  })

  // POST /questions — admin creates
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const dto = AdminQuestionSchema.parse(request.body)
    const result = await questionsService.adminCreate(dto)
    return reply.status(201).send({ data: result })
  })

  // PATCH /questions/:id — admin updates
  app.patch('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const dto = AdminQuestionSchema.partial().parse(request.body)
    const result = await questionsService.adminUpdate(id, dto)
    return reply.send({ data: result })
  })

  // DELETE /questions/:id — admin deletes
  app.delete('/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    await questionsService.adminDelete(id)
    return reply.status(204).send()
  })
}
