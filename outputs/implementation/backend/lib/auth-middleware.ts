import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken } from '@/modules/auth/auth.service'

declare module 'fastify' {
  interface FastifyRequest {
    user: { userId: string; role: string }
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Access token required' } })
  }
  try {
    const token = header.slice(7)
    const payload = verifyAccessToken(token)
    request.user = { userId: payload.sub, role: payload.role }
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } })
  }
}

export function requireRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply)
    if (reply.sent) return
    if (request.user.role !== role) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    }
  }
}

export const requireAdmin = requireRole('admin')
export const requireCandidate = requireRole('candidate')
export const requireExpert = requireRole('expert')
