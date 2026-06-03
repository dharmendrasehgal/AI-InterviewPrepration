import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import { verifyAccessToken } from '@/modules/auth/auth.service'
import { logger } from '@/lib/logger'

// sessionId → set of at most 2 connected peers
const rooms = new Map<string, Set<WebSocket>>()

function broadcast(room: Set<WebSocket>, sender: WebSocket, data: string) {
  for (const peer of room) {
    if (peer !== sender && peer.readyState === 1 /* OPEN */) {
      peer.send(data)
    }
  }
}

function cleanupSocket(sessionId: string, socket: WebSocket) {
  const room = rooms.get(sessionId)
  if (!room) return
  room.delete(socket)
  if (room.size === 0) {
    rooms.delete(sessionId)
  } else {
    // Notify remaining peer that their counterpart left
    broadcast(room, socket, JSON.stringify({ type: 'peer-left' }))
  }
  logger.info({ sessionId, roomSize: room?.size ?? 0 }, 'Signaling peer disconnected')
}

export async function signalingRoutes(app: FastifyInstance) {
  app.get(
    '/:sessionId',
    { websocket: true },
    async (socket, request) => {
      const { sessionId } = request.params as { sessionId: string }

      // Authenticate via Bearer token in query string (WebSocket upgrade cannot set headers from browser)
      const token = (request.query as Record<string, string>).token
      if (!token) {
        socket.close(4001, 'Missing token')
        return
      }

      try {
        verifyAccessToken(token)
      } catch {
        socket.close(4001, 'Invalid token')
        return
      }

      // Enforce max 2 peers per room (candidate + expert)
      let room = rooms.get(sessionId)
      if (!room) {
        room = new Set()
        rooms.set(sessionId, room)
      }
      if (room.size >= 2) {
        socket.close(4003, 'Room full')
        return
      }

      room.add(socket)
      logger.info({ sessionId, roomSize: room.size }, 'Signaling peer connected')

      socket.on('message', (data: Buffer) => {
        try {
          const msg = data.toString('utf8')
          // Relay the raw message to the other peer — no server-side interpretation
          broadcast(room!, socket, msg)
        } catch {
          // Malformed message — ignore
        }
      })

      socket.on('close', () => cleanupSocket(sessionId, socket))
      socket.on('error', () => cleanupSocket(sessionId, socket))
    },
  )
}
