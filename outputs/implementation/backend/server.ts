import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyMultipart from '@fastify/multipart'
import fastifyRateLimit from '@fastify/rate-limit'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'
import { authRoutes } from '@/modules/auth/auth.routes'
import { usersRoutes } from '@/modules/users/users.routes'
import { questionsRoutes } from '@/modules/questions/questions.routes'
import { mockSessionsRoutes } from '@/modules/mock-sessions/mock-sessions.routes'
import { feedbackRoutes } from '@/modules/feedback/feedback.routes'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  trustProxy: true,
  genReqId: () => crypto.randomUUID(),
})

async function build() {
  // ─── Security plugins ──────────────────────────────────────────
  await server.register(fastifyHelmet, {
    contentSecurityPolicy: false, // API-only: no HTML served
  })

  await server.register(fastifyCors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await server.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET ?? process.env.JWT_REFRESH_SECRET ?? 'dev-cookie-secret',
  })

  // ─── Rate limiting ─────────────────────────────────────────────
  await server.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        details: { retry_after_seconds: Math.ceil(context.ttl / 1000) },
      },
    }),
  })

  // ─── Multipart (file uploads) ──────────────────────────────────
  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 1,
    },
  })

  // ─── CSRF mitigation on cookie-based auth endpoints ───────────
  // DEF-002: For refresh/logout (cookie-only endpoints), require the
  // X-Requested-With header that browsers don't auto-send cross-origin.
  server.addHook('preHandler', async (request, reply) => {
    const csrfPaths = ['/api/v1/auth/refresh', '/api/v1/auth/logout']
    if (csrfPaths.includes(request.url) && request.method === 'POST') {
      const header = request.headers['x-requested-with']
      if (header !== 'XMLHttpRequest') {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'Missing X-Requested-With header' },
        })
      }
    }
  })

  // ─── Routes ────────────────────────────────────────────────────
  await server.register(authRoutes, { prefix: '/api/v1/auth' })
  await server.register(usersRoutes, { prefix: '/api/v1/users' })
  await server.register(questionsRoutes, { prefix: '/api/v1/questions' })
  await server.register(mockSessionsRoutes, { prefix: '/api/v1/mock-sessions' })
  await server.register(feedbackRoutes, { prefix: '/api/v1/feedback' })

  // ─── Health & readiness ────────────────────────────────────────
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
  }))

  server.get('/ready', async () => ({ status: 'ready' }))

  // ─── Global error handler ──────────────────────────────────────
  server.setErrorHandler(async (error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.flatten().fieldErrors,
        },
      })
    }

    const appError = error as NodeJS.ErrnoException & { code?: string; status?: number }

    if (appError.status && appError.status < 500) {
      return reply.status(appError.status).send({
        error: {
          code: appError.code ?? 'REQUEST_ERROR',
          message: appError.message,
        },
      })
    }

    logger.error({ err: error, reqId: request.id, path: request.url }, 'Unhandled error')
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlation_id: request.id,
      },
    })
  })

  return server
}

async function start() {
  try {
    const app = await build()
    await app.listen({ port: 3001, host: '::' })
    logger.info('API server listening on port 3001')
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

start()
