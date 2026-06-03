import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/db/connection'
import { expertSessions, bookings, experts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { bookingsService } from '@/modules/bookings/bookings.service'
import { logger } from '@/lib/logger'
import type { CompleteSessionDto } from './live-sessions.schema'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
  forcePathStyle: true,
})

const RECORDINGS_BUCKET = process.env.S3_RECORDINGS_BUCKET ?? 'interview-prep-recordings-local'

async function getSessionWithAuthz(sessionId: string, userId: string, role: 'candidate' | 'expert' | 'any') {
  const [session] = await db
    .select()
    .from(expertSessions)
    .where(eq(expertSessions.id, sessionId))
    .limit(1)

  if (!session) {
    throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 })
  }

  if (role !== 'any') {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, session.bookingId))
      .limit(1)

    if (!booking) {
      throw Object.assign(new Error('Booking not found'), { code: 'NOT_FOUND', status: 404 })
    }

    if (role === 'candidate' && booking.candidateId !== userId) {
      throw Object.assign(new Error('Access denied'), { code: 'FORBIDDEN', status: 403 })
    }

    if (role === 'expert') {
      const [expert] = await db
        .select({ userId: experts.userId })
        .from(experts)
        .where(eq(experts.id, booking.expertId))
        .limit(1)
      if (expert?.userId !== userId) {
        throw Object.assign(new Error('Access denied'), { code: 'FORBIDDEN', status: 403 })
      }
    }
  }

  return session
}

export const liveSessionsService = {
  getIceConfig() {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        ...(process.env.TURN_SERVER_URL
          ? [{
              urls: process.env.TURN_SERVER_URL,
              username: process.env.TURN_SERVER_USERNAME ?? '',
              credential: process.env.TURN_SERVER_CREDENTIAL ?? '',
            }]
          : []),
      ],
    }
  },

  async recordConsent(sessionId: string, candidateUserId: string) {
    const session = await getSessionWithAuthz(sessionId, candidateUserId, 'candidate')

    if (session.consentAt) {
      return { session_id: sessionId, consent_at: session.consentAt }
    }

    const consentAt = new Date()
    await db
      .update(expertSessions)
      .set({ consentAt })
      .where(eq(expertSessions.id, sessionId))

    return { session_id: sessionId, consent_at: consentAt }
  },

  async start(sessionId: string, expertUserId: string) {
    const session = await getSessionWithAuthz(sessionId, expertUserId, 'expert')

    if (!session.consentAt) {
      throw Object.assign(new Error('Candidate consent has not been recorded'), { code: 'INVALID_STATE', status: 400 })
    }
    if (session.status !== 'pending') {
      throw Object.assign(new Error('Session is not in pending state'), { code: 'INVALID_STATE', status: 400 })
    }

    const startedAt = new Date()
    await db
      .update(expertSessions)
      .set({ status: 'in_progress', startedAt })
      .where(eq(expertSessions.id, sessionId))

    return { session_id: sessionId, status: 'in_progress', started_at: startedAt }
  },

  async uploadRecording(sessionId: string, expertUserId: string, buffer: Buffer, mimetype: string) {
    const session = await getSessionWithAuthz(sessionId, expertUserId, 'expert')

    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session must be in progress to upload recording'), { code: 'INVALID_STATE', status: 400 })
    }

    const s3Key = `live-sessions/${sessionId}/recording.webm`

    await s3.send(new PutObjectCommand({
      Bucket: RECORDINGS_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimetype,
    }))

    await db
      .update(expertSessions)
      .set({ recordingKey: s3Key })
      .where(eq(expertSessions.id, sessionId))

    logger.info({ sessionId, s3Key }, 'Live session recording uploaded')

    return { session_id: sessionId, recording_key: s3Key }
  },

  async complete(sessionId: string, expertUserId: string, dto: CompleteSessionDto) {
    const session = await getSessionWithAuthz(sessionId, expertUserId, 'expert')

    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session is not in progress'), { code: 'INVALID_STATE', status: 400 })
    }

    const endedAt = new Date()

    await db.transaction(async (tx) => {
      await tx
        .update(expertSessions)
        .set({ status: 'completed', endedAt })
        .where(eq(expertSessions.id, sessionId))

      await bookingsService.complete(session.bookingId)
    })

    return { session_id: sessionId, status: 'completed', ended_at: endedAt }
  },

  async get(sessionId: string, userId: string) {
    const session = await getSessionWithAuthz(sessionId, userId, 'any')
    return {
      session_id: session.id,
      booking_id: session.bookingId,
      status: session.status,
      consent_at: session.consentAt,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      has_recording: !!session.recordingKey,
    }
  },
}
