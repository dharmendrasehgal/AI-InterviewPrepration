import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authService } from './auth.service'
import { RegisterSchema, LoginSchema } from './auth.schema'

const REFRESH_COOKIE = 'refresh_token'
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api/v1/auth',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body)
    const result = await authService.register(body)
    return reply.status(201).send({
      data: result,
      meta: { message: 'Verification email sent' },
    })
  })

  // POST /auth/login
  app.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body)
    const ip = request.ip
    const result = await authService.login(body, ip)

    reply.setCookie(REFRESH_COOKIE, result.refresh_token, COOKIE_OPTS)
    return reply.send({
      data: {
        access_token: result.access_token,
        expires_in: result.expires_in,
        user: result.user,
      },
    })
  })

  // POST /auth/logout
  app.post('/logout', async (request, reply) => {
    const rawToken = request.cookies[REFRESH_COOKIE]
    if (rawToken) {
      await authService.logout(rawToken)
    }
    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
    return reply.send({ data: { logged_out: true } })
  })

  // POST /auth/refresh
  app.post('/refresh', async (request, reply) => {
    const rawToken = request.cookies[REFRESH_COOKIE]
    if (!rawToken) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No refresh token' } })
    }

    const tokens = await authService.refreshTokens(rawToken)
    reply.setCookie(REFRESH_COOKIE, tokens.refresh_token, COOKIE_OPTS)
    return reply.send({
      data: { access_token: tokens.access_token, expires_in: tokens.expires_in },
    })
  })

  // POST /auth/verify-email
  app.post('/verify-email', async (request, reply) => {
    const { token } = z.object({ token: z.string().min(1) }).parse(request.body)
    const result = await authService.verifyEmail(token)
    return reply.send({ data: result })
  })

  // POST /auth/forgot-password — stub (email not fully wired)
  app.post('/forgot-password', async (request, reply) => {
    // Always return 200 to avoid email enumeration
    z.object({ email: z.string().email() }).parse(request.body)
    return reply.send({ data: { message: 'If that email exists, a reset link has been sent.' } })
  })
}
