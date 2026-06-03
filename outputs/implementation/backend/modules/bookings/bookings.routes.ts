import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { CreateBookingSchema, CancelBookingSchema } from './bookings.schema'
import { bookingsService } from './bookings.service'

export async function bookingsRoutes(app: FastifyInstance) {
  // POST /bookings — candidate books an expert slot
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const dto = CreateBookingSchema.parse(request.body)
    const result = await bookingsService.create(request.user.userId, dto)
    return reply.status(201).send({ data: result })
  })

  // GET /bookings — candidate's own bookings
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const result = await bookingsService.listByCandidate(request.user.userId)
    return reply.send({ data: result })
  })

  // GET /bookings/:id — get single booking (candidate or expert)
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await bookingsService.get(id, request.user.userId)
    return reply.send({ data: result })
  })

  // POST /bookings/:id/cancel — candidate or expert cancels
  app.post('/:id/cancel', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const dto = CancelBookingSchema.parse(request.body)
    const result = await bookingsService.cancel(id, request.user.userId, dto)
    return reply.send({ data: result })
  })
}
