import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireExpert } from '@/lib/auth-middleware'
import { CompleteSessionSchema } from './live-sessions.schema'
import { liveSessionsService } from './live-sessions.service'

export async function liveSessionsRoutes(app: FastifyInstance) {
  // GET /live-sessions/ice-config — TURN/STUN server credentials for WebRTC
  app.get('/ice-config', { preHandler: requireAuth }, async (_request, reply) => {
    return reply.send({ data: liveSessionsService.getIceConfig() })
  })

  // GET /live-sessions/:id — get session state
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await liveSessionsService.get(id, request.user.userId)
    return reply.send({ data: result })
  })

  // POST /live-sessions/:id/consent — candidate logs consent before session starts
  app.post('/:id/consent', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await liveSessionsService.recordConsent(id, request.user.userId)
    return reply.send({ data: result })
  })

  // POST /live-sessions/:id/start — expert starts the session
  app.post('/:id/start', { preHandler: requireExpert }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await liveSessionsService.start(id, request.user.userId)
    return reply.send({ data: result })
  })

  // POST /live-sessions/:id/recording — expert uploads the recording
  app.post('/:id/recording', { preHandler: requireExpert }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)

    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'No recording file provided' } })
    }

    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    const result = await liveSessionsService.uploadRecording(id, request.user.userId, buffer, data.mimetype)
    return reply.status(202).send({ data: result })
  })

  // POST /live-sessions/:id/complete — expert marks session complete
  app.post('/:id/complete', { preHandler: requireExpert }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const dto = CompleteSessionSchema.parse(request.body)
    const result = await liveSessionsService.complete(id, request.user.userId, dto)
    return reply.send({ data: result })
  })
}
