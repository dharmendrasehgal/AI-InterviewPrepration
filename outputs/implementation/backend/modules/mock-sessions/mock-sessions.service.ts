import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Queue } from 'bullmq'
import { db } from '@/db/connection'
import { mockSessions, sessionResponses, questions } from '@/db/schema'
import { eq, and, ne, sql, notInArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'

function parseRedisConnection(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  }
}

let _scoringQueue: Queue | null = null
function getScoringQueue(): Queue {
  if (!_scoringQueue) {
    _scoringQueue = new Queue('scoring', {
      connection: parseRedisConnection(process.env.REDIS_URL ?? 'redis://localhost:6379'),
    })
  }
  return _scoringQueue
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  },
  forcePathStyle: true, // required for LocalStack
})

const RECORDINGS_BUCKET = process.env.S3_RECORDINGS_BUCKET ?? 'interview-prep-recordings-local'

export const mockSessionsService = {
  async create(userId: string, params: { question_count: number; track: string; level: string }) {
    const count = Math.min(Math.max(params.question_count, 1), 10)

    const [session] = await db
      .insert(mockSessions)
      .values({
        userId,
        questionCount: count,
        track: params.track,
        level: params.level,
        status: 'awaiting_consent',
      })
      .returning({ id: mockSessions.id, status: mockSessions.status, questionCount: mockSessions.questionCount })

    return {
      session_id: session.id,
      status: session.status,
      question_count: session.questionCount,
    }
  },

  async getSession(sessionId: string, userId: string) {
    const [session] = await db
      .select()
      .from(mockSessions)
      .where(and(eq(mockSessions.id, sessionId), eq(mockSessions.userId, userId)))
      .limit(1)

    if (!session) {
      throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 })
    }

    return session
  },

  async recordConsent(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId)
    if (session.status !== 'awaiting_consent') {
      throw Object.assign(new Error('Session is not awaiting consent'), { code: 'INVALID_STATE', status: 400 })
    }

    const consentAt = new Date()
    await db
      .update(mockSessions)
      .set({ status: 'in_progress', consentLoggedAt: consentAt })
      .where(eq(mockSessions.id, sessionId))

    return {
      consent_logged_at: consentAt.toISOString(),
      session_token: `st_${sessionId}`,
    }
  },

  async getNextQuestion(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId)
    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session not in progress'), { code: 'INVALID_STATE', status: 400 })
    }

    // Count responses already submitted
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId))

    const responseCount = Number(count)

    if (responseCount >= session.questionCount) {
      throw Object.assign(new Error('All questions answered'), { code: 'SESSION_COMPLETE', status: 409 })
    }

    // Get already-used question IDs
    const used = await db
      .select({ questionId: sessionResponses.questionId })
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId))

    const usedIds = used.map((r) => r.questionId)

    // Pick next question matching track/level, excluding already used
    const conditions = [
      eq(questions.status, 'published'),
      eq(questions.type, session.track as never),
      eq(questions.level, session.level as never),
    ]

    if (usedIds.length > 0) {
      conditions.push(notInArray(questions.id, usedIds))
    }

    const [question] = await db
      .select({ id: questions.id, text: questions.text, framework: questions.framework })
      .from(questions)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1)

    if (!question) {
      throw Object.assign(new Error('No more questions available for this track'), { code: 'NO_QUESTIONS', status: 404 })
    }

    return {
      id: question.id,
      text: question.text,
      framework: question.framework,
      response_index: responseCount,
    }
  },

  async uploadResponse(
    sessionId: string,
    userId: string,
    questionId: string,
    responseIndex: number,
    buffer: Buffer,
    mimetype: string,
  ) {
    const session = await this.getSession(sessionId, userId)
    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session not in progress'), { code: 'INVALID_STATE', status: 400 })
    }

    const s3Key = `sessions/${sessionId}/response-${responseIndex}.webm`

    await s3.send(
      new PutObjectCommand({
        Bucket: RECORDINGS_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: mimetype,
      }),
    )

    const [response] = await db
      .insert(sessionResponses)
      .values({
        sessionId,
        responseIndex,
        questionId,
        transcript: null, // filled by worker after whisper STT
        durationSeconds: null,
      })
      .returning({ id: sessionResponses.id })

    logger.info({ sessionId, responseIndex, s3Key }, 'Response uploaded')

    return { response_id: response.id, status: 'processing' }
  },

  async complete(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId)
    if (session.status !== 'in_progress') {
      throw Object.assign(new Error('Session not in progress'), { code: 'INVALID_STATE', status: 400 })
    }

    const completedAt = new Date()
    await db
      .update(mockSessions)
      .set({ status: 'processing', completedAt })
      .where(eq(mockSessions.id, sessionId))

    // Enqueue scoring job
    await getScoringQueue().add('score-session', { sessionId })

    return { status: 'processing', completed_at: completedAt.toISOString() }
  },

  async getScore(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId)

    if (session.status === 'processing' || session.status === 'in_progress') {
      return null // caller returns 202
    }

    if (session.status === 'failed') {
      throw Object.assign(new Error('Scoring failed'), { code: 'SCORING_FAILED', status: 500 })
    }

    if (session.status !== 'scored') {
      throw Object.assign(new Error('Session not yet scored'), { code: 'INVALID_STATE', status: 400 })
    }

    const responses = await db
      .select()
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId))
      .orderBy(sessionResponses.responseIndex)

    const perQuestion = responses.map((r) => ({
      question_id: r.questionId,
      speech_rate_wpm: r.speechRateWpm ?? 0,
      filler_word_count: r.fillerWordCount ?? 0,
      filler_percentage: r.fillerPercentage ?? 0,
      keyword_relevance: r.keywordRelevance ?? 0,
      clarity_score: r.clarityScore ?? 0,
      improvement_tip: r.improvementTip ?? '',
    }))

    const scored = perQuestion.filter((r) => r.clarity_score > 0)
    const avgWpm = scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + r.speech_rate_wpm, 0) / scored.length)
      : 0
    const totalFillers = scored.reduce((s, r) => s + r.filler_word_count, 0)
    const avgKeyword = scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + r.keyword_relevance, 0) / scored.length)
      : 0

    return {
      session_id: sessionId,
      composite_score: session.compositeScore ?? 0,
      completed_at: session.completedAt?.toISOString() ?? '',
      per_question: perQuestion,
      session_summary: {
        avg_speech_rate_wpm: avgWpm,
        total_filler_words: totalFillers,
        avg_keyword_relevance: avgKeyword,
      },
    }
  },

  async getRecordingUrl(sessionId: string, userId: string) {
    // Verify session belongs to user
    await this.getSession(sessionId, userId)

    const s3Key = `sessions/${sessionId}/recording.webm`
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: RECORDINGS_BUCKET, Key: s3Key }),
      { expiresIn: 3600 },
    )

    const expiresAt = new Date(Date.now() + 3600 * 1000)
    return { url, expires_at: expiresAt.toISOString(), duration_seconds: null }
  },
}
