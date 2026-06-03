import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireExpert } from '@/lib/auth-middleware'
import { CreateSlotSchema, ListAvailabilityQuerySchema } from './availability.schema'
import { availabilityService } from './availability.service'

export async function availabilityRoutes(app: FastifyInstance) {
  // POST /experts/:expertId/availability — expert adds a time slot
  app.post('/:expertId/availability', { preHandler: requireExpert }, async (request, reply) => {
    const { expertId } = z.object({ expertId: z.string().uuid() }).parse(request.params)
    const dto = CreateSlotSchema.parse(request.body)

    // Service verifies the requesting user owns this expert profile
    const result = await availabilityService.addSlot(request.user.userId, dto)
    return reply.status(201).send({ data: result })
  })

  // DELETE /experts/:expertId/availability/:slotId — expert removes an unbooked slot
  app.delete('/:expertId/availability/:slotId', { preHandler: requireExpert }, async (request, reply) => {
    const { slotId } = z.object({
      expertId: z.string().uuid(),
      slotId: z.string().uuid(),
    }).parse(request.params)

    const result = await availabilityService.removeSlot(request.user.userId, slotId)
    return reply.status(200).send({ data: result })
  })

  // GET /experts/:expertId/availability — list slots (public for browsing, filtered for booking)
  app.get('/:expertId/availability', { preHandler: requireAuth }, async (request, reply) => {
    const { expertId } = z.object({ expertId: z.string().uuid() }).parse(request.params)
    const query = ListAvailabilityQuerySchema.parse(request.query)
    const result = await availabilityService.listByExpert(expertId, query)
    return reply.send({ data: result })
  })
}
