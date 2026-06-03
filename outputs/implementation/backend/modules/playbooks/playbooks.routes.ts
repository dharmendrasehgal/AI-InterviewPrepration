import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-middleware'
import { CreatePlaybookSchema, UpdatePlaybookSchema } from './playbooks.schema'
import { playbooksService } from './playbooks.service'

const TRACKS = z.enum(['general_career', 'software_engineering', 'medical'])

export async function playbooksRoutes(app: FastifyInstance) {
  // GET /playbooks — list all published playbooks (public)
  app.get('/', async (_request, reply) => {
    const result = await playbooksService.list()
    return reply.send({ data: result })
  })

  // GET /playbooks/:track — get full playbook content (public)
  app.get('/:track', async (request, reply) => {
    const { track } = z.object({ track: TRACKS }).parse(request.params)
    const result = await playbooksService.get(track)
    return reply.send({ data: result })
  })

  // POST /playbooks — admin creates a new playbook
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const dto = CreatePlaybookSchema.parse(request.body)
    const result = await playbooksService.create(dto)
    return reply.status(201).send({ data: result })
  })

  // PATCH /playbooks/:track — admin updates content
  app.patch('/:track', { preHandler: requireAdmin }, async (request, reply) => {
    const { track } = z.object({ track: TRACKS }).parse(request.params)
    const dto = UpdatePlaybookSchema.parse(request.body)
    const result = await playbooksService.update(track, dto)
    return reply.send({ data: result })
  })

  // POST /playbooks/:track/publish — admin publishes a playbook
  app.post('/:track/publish', { preHandler: requireAdmin }, async (request, reply) => {
    const { track } = z.object({ track: TRACKS }).parse(request.params)
    const result = await playbooksService.publish(track)
    return reply.send({ data: result })
  })
}
