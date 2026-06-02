import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from '@/db/connection'
import { mockSessions } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

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

export interface FeedbackFilter {
  type?: string
  date_from?: string
  date_to?: string
  score_min?: number
  score_max?: number
  cursor?: string
  page_size?: number
}

export const feedbackService = {
  async list(userId: string, filter: FeedbackFilter) {
    const pageSize = Math.min(filter.page_size ?? 20, 100)

    const conditions = [eq(mockSessions.userId, userId)]

    if (filter.date_from) {
      conditions.push(gte(mockSessions.createdAt, new Date(filter.date_from)))
    }
    if (filter.date_to) {
      conditions.push(lte(mockSessions.createdAt, new Date(filter.date_to)))
    }
    if (filter.score_min !== undefined) {
      conditions.push(gte(mockSessions.compositeScore, filter.score_min))
    }
    if (filter.score_max !== undefined) {
      conditions.push(lte(mockSessions.compositeScore, filter.score_max))
    }
    if (filter.cursor) {
      conditions.push(sql`${mockSessions.id} < ${filter.cursor}`)
    }

    const rows = await db
      .select({
        id: mockSessions.id,
        status: mockSessions.status,
        compositeScore: mockSessions.compositeScore,
        track: mockSessions.track,
        level: mockSessions.level,
        createdAt: mockSessions.createdAt,
        completedAt: mockSessions.completedAt,
      })
      .from(mockSessions)
      .where(and(...conditions))
      .orderBy(sql`${mockSessions.createdAt} DESC`)
      .limit(pageSize + 1)

    const hasMore = rows.length > pageSize
    const items = rows.slice(0, pageSize)

    return {
      items: items.map((s) => ({
        session_id: s.id,
        type: 'ai_mock' as const,
        created_at: s.createdAt.toISOString(),
        composite_score: s.compositeScore,
        status: s.status,
        track: s.track,
        level: s.level,
        expert_name: null,
        rubric_score: null,
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      has_more: hasMore,
      total: items.length,
    }
  },

  async getRecordingUrl(sessionId: string, userId: string) {
    const [session] = await db
      .select({ id: mockSessions.id })
      .from(mockSessions)
      .where(and(eq(mockSessions.id, sessionId), eq(mockSessions.userId, userId)))
      .limit(1)

    if (!session) {
      throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const s3Key = `sessions/${sessionId}/recording.webm`
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: RECORDINGS_BUCKET, Key: s3Key }),
      { expiresIn: 3600 },
    )

    return {
      url,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      duration_seconds: null,
    }
  },
}
