import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '@/lib/auth-middleware'
import { RegisterExpertSchema, UpdateExpertSchema, ListExpertsQuerySchema } from './experts.schema'
import { expertsService } from './experts.service'

export async function expertsRoutes(app: FastifyInstance) {
  // POST /experts — apply to become an expert (any authenticated user)
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const dto = RegisterExpertSchema.parse(request.body)
    const result = await expertsService.register(request.user.userId, dto)
    return reply.status(201).send({ data: result })
  })

  // GET /experts — browse approved expert marketplace
  app.get('/', async (request, reply) => {
    const query = ListExpertsQuerySchema.parse(request.query)
    const result = await expertsService.list(query)
    return reply.send({ data: result })
  })

  // GET /experts/pending — admin: list pending applications
  app.get('/pending', { preHandler: requireAdmin }, async (_request, reply) => {
    const result = await expertsService.listPending()
    return reply.send({ data: result })
  })

  // GET /experts/me — current expert's own profile
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const result = await expertsService.getByUserId(request.user.userId)
    return reply.send({ data: result })
  })

  // GET /experts/:id — public expert profile
  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await expertsService.get(id)
    return reply.send({ data: result })
  })

  // PATCH /experts/:id — expert updates own profile
  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const dto = UpdateExpertSchema.parse(request.body)
    const result = await expertsService.updateProfile(id, request.user.userId, dto)
    return reply.send({ data: result })
  })

  // POST /experts/:id/approve — admin approves expert application
  app.post('/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await expertsService.approve(id, request.user.userId)
    return reply.send({ data: result })
  })

  // POST /experts/:id/suspend — admin suspends expert
  app.post('/:id/suspend', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
    const result = await expertsService.suspend(id)
    return reply.send({ data: result })
  })
}
