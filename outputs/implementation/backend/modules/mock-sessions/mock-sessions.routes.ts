import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { mockSessionsService } from './mock-sessions.service'

const CreateSchema = z.object({
  question_count: z.number().int().min(1).max(10).default(5),
  track: z.enum(['behavioral', 'technical', 'situational', 'role_specific']).default('behavioral'),
  level: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid'),
})

export async function mockSessionsRoutes(app: FastifyInstance) {
  // POST /mock-sessions
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const dto = CreateSchema.parse(request.body)
    const session = await mockSessionsService.create(request.user.userId, dto)
    return reply.status(201).send({ data: session })
  })

  // GET /mock-sessions/:id
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const session = await mockSessionsService.getSession(id, request.user.userId)
    return reply.send({ data: session })
  })

  // POST /mock-sessions/:id/consent
  app.post('/:id/consent', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await mockSessionsService.recordConsent(id, request.user.userId)
    return reply.send({ data: result })
  })

  // GET /mock-sessions/:id/question
  app.get('/:id/question', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const question = await mockSessionsService.getNextQuestion(id, request.user.userId)
    return reply.send({ data: question })
  })

  // POST /mock-sessions/:id/responses
  app.post('/:id/responses', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'No recording file uploaded' } })
    }

    const questionId = data.fields['question_id']
    const responseIndex = data.fields['response_index']

    const parsedQId = z.string().uuid().parse(
      typeof questionId === 'object' && 'value' in questionId ? questionId.value : questionId,
    )
    const parsedIdx = z.coerce.number().int().min(0).parse(
      typeof responseIndex === 'object' && 'value' in responseIndex ? responseIndex.value : responseIndex,
    )

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const result = await mockSessionsService.uploadResponse(
      id,
      request.user.userId,
      parsedQId,
      parsedIdx,
      buffer,
      data.mimetype,
    )

    return reply.status(202).send({ data: result })
  })

  // POST /mock-sessions/:id/complete
  app.post('/:id/complete', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await mockSessionsService.complete(id, request.user.userId)
    return reply.send({ data: result })
  })

  // GET /mock-sessions/:id/score
  app.get('/:id/score', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const score = await mockSessionsService.getScore(id, request.user.userId)

    if (!score) {
      return reply.status(202).send({ data: { status: 'processing' } })
    }

    return reply.send({ data: score })
  })

  // GET /mock-sessions/:id/ice-config — stub for Phase 2 WebRTC
  app.get('/:id/ice-config', { preHandler: requireAuth }, async (_request, reply) => {
    return reply.send({
      data: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    })
  })
}
