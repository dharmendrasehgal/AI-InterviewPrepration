import { db } from '@/db/connection'
import { rubricEvaluations, expertSessions, bookings, experts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { encryptField, decryptField } from '@/lib/crypto'
import type { SubmitRubricDto } from './rubric.schema'

async function resolveExpertId(userId: string): Promise<string> {
  const [expert] = await db
    .select({ id: experts.id })
    .from(experts)
    .where(eq(experts.userId, userId))
    .limit(1)

  if (!expert) {
    throw Object.assign(new Error('Expert profile not found'), { code: 'NOT_FOUND', status: 404 })
  }

  return expert.id
}

export const rubricService = {
  async submit(expertSessionId: string, expertUserId: string, dto: SubmitRubricDto) {
    const expertId = await resolveExpertId(expertUserId)

    const [session] = await db
      .select()
      .from(expertSessions)
      .where(eq(expertSessions.id, expertSessionId))
      .limit(1)

    if (!session) {
      throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND', status: 404 })
    }
    if (session.status !== 'completed') {
      throw Object.assign(new Error('Rubric can only be submitted after the session is completed'), {
        code: 'INVALID_STATE',
        status: 400,
      })
    }

    // Verify this expert conducted the session
    const [booking] = await db
      .select({ expertId: bookings.expertId })
      .from(bookings)
      .where(eq(bookings.id, session.bookingId))
      .limit(1)

    if (booking?.expertId !== expertId) {
      throw Object.assign(new Error('You did not conduct this session'), { code: 'FORBIDDEN', status: 403 })
    }

    // Check not already submitted
    const [existing] = await db
      .select({ id: rubricEvaluations.id })
      .from(rubricEvaluations)
      .where(eq(rubricEvaluations.expertSessionId, expertSessionId))
      .limit(1)

    if (existing) {
      throw Object.assign(new Error('Rubric already submitted for this session'), { code: 'CONFLICT', status: 409 })
    }

    const [rubric] = await db
      .insert(rubricEvaluations)
      .values({
        expertSessionId,
        expertId,
        communication: dto.communication,
        technicalDepth: dto.technical_depth,
        structuredThinking: dto.structured_thinking,
        confidence: dto.confidence,
        feedbackText: dto.feedback_text,
        notesEncrypted: dto.notes ? encryptField(dto.notes) : null,
      })
      .returning()

    const overallScore = (dto.communication + dto.technical_depth + dto.structured_thinking + dto.confidence) / 4

    return {
      rubric_id: rubric.id,
      overall_score: Math.round(overallScore * 10) / 10,
      submitted_at: rubric.submittedAt,
    }
  },

  async get(expertSessionId: string, requestingUserId: string) {
    const [rubric] = await db
      .select()
      .from(rubricEvaluations)
      .where(eq(rubricEvaluations.expertSessionId, expertSessionId))
      .limit(1)

    if (!rubric) {
      throw Object.assign(new Error('Rubric not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const overallScore = (rubric.communication + rubric.technicalDepth + rubric.structuredThinking + rubric.confidence) / 4

    const isExpertOwner = (await resolveExpertId(requestingUserId).catch(() => null)) === rubric.expertId

    return {
      rubric_id: rubric.id,
      communication: rubric.communication,
      technical_depth: rubric.technicalDepth,
      structured_thinking: rubric.structuredThinking,
      confidence: rubric.confidence,
      overall_score: Math.round(overallScore * 10) / 10,
      feedback_text: rubric.feedbackText,
      // Private expert notes only visible to the expert who wrote them
      notes: isExpertOwner && rubric.notesEncrypted ? decryptField(rubric.notesEncrypted) : undefined,
      submitted_at: rubric.submittedAt,
    }
  },
}
