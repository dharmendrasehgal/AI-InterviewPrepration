import { db } from '@/db/connection'
import { experts, users } from '@/db/schema'
import { eq, and, lte, gt } from 'drizzle-orm'
import { encryptField, decryptField } from '@/lib/crypto'
import type { RegisterExpertDto, UpdateExpertDto, ListExpertsQuery } from './experts.schema'

export const expertsService = {
  async register(userId: string, dto: RegisterExpertDto) {
    const existing = await db
      .select({ id: experts.id })
      .from(experts)
      .where(eq(experts.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      throw Object.assign(new Error('Expert profile already exists'), { code: 'CONFLICT', status: 409 })
    }

    const [expert] = await db
      .insert(experts)
      .values({
        userId,
        bioEncrypted: encryptField(dto.bio),
        headline: dto.headline,
        industry: dto.industry,
        track: dto.track,
        yearsExp: dto.years_exp,
        rateCents: dto.rate_cents,
        status: 'pending',
      })
      .returning({ id: experts.id, status: experts.status })

    return { expert_id: expert.id, status: expert.status }
  },

  async approve(expertId: string, adminUserId: string) {
    const [expert] = await db
      .select({ id: experts.id, userId: experts.userId, status: experts.status })
      .from(experts)
      .where(eq(experts.id, expertId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert not found'), { code: 'NOT_FOUND', status: 404 })
    }
    if (expert.status === 'approved') {
      throw Object.assign(new Error('Expert already approved'), { code: 'INVALID_STATE', status: 400 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(experts)
        .set({ status: 'approved', approvedAt: new Date(), approvedBy: adminUserId, updatedAt: new Date() })
        .where(eq(experts.id, expertId))

      await tx
        .update(users)
        .set({ role: 'expert', updatedAt: new Date() })
        .where(eq(users.id, expert.userId))
    })

    return { expert_id: expertId, status: 'approved' }
  },

  async suspend(expertId: string) {
    const [expert] = await db
      .select({ id: experts.id, userId: experts.userId })
      .from(experts)
      .where(eq(experts.id, expertId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert not found'), { code: 'NOT_FOUND', status: 404 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(experts)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(eq(experts.id, expertId))

      await tx
        .update(users)
        .set({ role: 'candidate', updatedAt: new Date() })
        .where(eq(users.id, expert.userId))
    })

    return { expert_id: expertId, status: 'suspended' }
  },

  async get(expertId: string) {
    const [expert] = await db
      .select()
      .from(experts)
      .where(and(eq(experts.id, expertId), eq(experts.status, 'approved')))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert not found'), { code: 'NOT_FOUND', status: 404 })
    }

    return {
      expert_id: expert.id,
      headline: expert.headline,
      bio: decryptField(expert.bioEncrypted),
      industry: expert.industry,
      track: expert.track,
      years_exp: expert.yearsExp,
      rate_cents: expert.rateCents,
    }
  },

  async getByUserId(userId: string) {
    const [expert] = await db
      .select()
      .from(experts)
      .where(eq(experts.userId, userId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert profile not found'), { code: 'NOT_FOUND', status: 404 })
    }

    return {
      expert_id: expert.id,
      headline: expert.headline,
      bio: decryptField(expert.bioEncrypted),
      industry: expert.industry,
      track: expert.track,
      years_exp: expert.yearsExp,
      rate_cents: expert.rateCents,
      status: expert.status,
    }
  },

  async list(query: ListExpertsQuery) {
    const pageSize = query.page_size ?? 20
    const conditions = [eq(experts.status, 'approved')]

    if (query.track) conditions.push(eq(experts.track, query.track))
    if (query.industry) conditions.push(eq(experts.industry, query.industry))
    if (query.max_rate_cents !== undefined) conditions.push(lte(experts.rateCents, query.max_rate_cents))
    if (query.cursor) conditions.push(gt(experts.id, query.cursor))

    const rows = await db
      .select({
        id: experts.id,
        headline: experts.headline,
        industry: experts.industry,
        track: experts.track,
        yearsExp: experts.yearsExp,
        rateCents: experts.rateCents,
      })
      .from(experts)
      .where(and(...conditions))
      .limit(pageSize + 1)

    const hasMore = rows.length > pageSize
    const items = hasMore ? rows.slice(0, pageSize) : rows

    return {
      items: items.map((e) => ({
        expert_id: e.id,
        headline: e.headline,
        industry: e.industry,
        track: e.track,
        years_exp: e.yearsExp,
        rate_cents: e.rateCents,
      })),
      next_cursor: hasMore ? items[items.length - 1].id : null,
      has_more: hasMore,
    }
  },

  async updateProfile(expertId: string, userId: string, dto: UpdateExpertDto) {
    const [expert] = await db
      .select({ id: experts.id, userId: experts.userId })
      .from(experts)
      .where(eq(experts.id, expertId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert not found'), { code: 'NOT_FOUND', status: 404 })
    }
    if (expert.userId !== userId) {
      throw Object.assign(new Error('Cannot update another expert\'s profile'), { code: 'FORBIDDEN', status: 403 })
    }

    const update: Record<string, unknown> = { updatedAt: new Date() }
    if (dto.headline !== undefined) update.headline = dto.headline
    if (dto.bio !== undefined) update.bioEncrypted = encryptField(dto.bio)
    if (dto.years_exp !== undefined) update.yearsExp = dto.years_exp
    if (dto.rate_cents !== undefined) update.rateCents = dto.rate_cents

    await db.update(experts).set(update).where(eq(experts.id, expertId))

    return { expert_id: expertId, updated: true }
  },

  async listPending() {
    const rows = await db
      .select({ id: experts.id, headline: experts.headline, industry: experts.industry, track: experts.track, createdAt: experts.createdAt })
      .from(experts)
      .where(eq(experts.status, 'pending'))

    return rows.map((e) => ({ expert_id: e.id, headline: e.headline, industry: e.industry, track: e.track, applied_at: e.createdAt }))
  },
}
