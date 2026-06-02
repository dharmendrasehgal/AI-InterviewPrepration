import 'dotenv/config'
import { Worker, Queue } from 'bullmq'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/db/connection'
import { mockSessions, sessionResponses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { scoringService } from '@/modules/scoring/scoring.service'
import { logger } from '@/lib/logger'

function parseRedisConnection(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  }
}

const connection = parseRedisConnection(process.env.REDIS_URL ?? 'redis://localhost:6379')

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
const WHISPER_ENDPOINT = process.env.WHISPER_ENDPOINT ?? 'http://whisper-mock:8080'

// ─── Whisper STT transcription ────────────────────────────────────

async function transcribeRecording(s3Key: string): Promise<{ text: string; duration_seconds: number }> {
  try {
    // Download from S3
    const obj = await s3.send(new GetObjectCommand({ Bucket: RECORDINGS_BUCKET, Key: s3Key }))
    const chunks: Uint8Array[] = []
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Send to Whisper endpoint
    const form = new FormData()
    form.append('audio', new Blob([buffer], { type: 'audio/webm' }), 'recording.webm')

    const res = await fetch(`${WHISPER_ENDPOINT}/transcribe`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`Whisper returned ${res.status}`)

    const json = await res.json() as { text: string; duration_seconds: number }
    return json
  } catch (err) {
    logger.warn({ err, s3Key }, 'Transcription failed — using empty transcript')
    return { text: '', duration_seconds: 0 }
  }
}

// ─── Scoring job processor ────────────────────────────────────────

const worker = new Worker(
  'scoring',
  async (job) => {
    const { sessionId } = job.data as { sessionId: string }

    logger.info({ sessionId, jobId: job.id }, 'Processing scoring job')

    try {
      // Get all session responses that need transcription
      const responses = await db
        .select()
        .from(sessionResponses)
        .where(eq(sessionResponses.sessionId, sessionId))
        .orderBy(sessionResponses.responseIndex)

      // Transcribe each response if transcript is missing
      for (const response of responses) {
        if (!response.transcript) {
          const s3Key = `sessions/${sessionId}/response-${response.responseIndex}.webm`
          const { text, duration_seconds } = await transcribeRecording(s3Key)

          await db
            .update(sessionResponses)
            .set({ transcript: text, durationSeconds: duration_seconds })
            .where(eq(sessionResponses.id, response.id))
        }
      }

      // Run AI scoring on all responses
      await scoringService.scoreSession(sessionId)

      logger.info({ sessionId }, 'Scoring completed successfully')
    } catch (err) {
      logger.error({ err, sessionId }, 'Scoring job failed')

      await db
        .update(mockSessions)
        .set({ status: 'failed' })
        .where(eq(mockSessions.id, sessionId))

      throw err
    }
  },
  { connection, concurrency: 3 },
)

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Scoring job completed'))
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Scoring job failed'))

logger.info('Worker started, listening on queue: scoring')
