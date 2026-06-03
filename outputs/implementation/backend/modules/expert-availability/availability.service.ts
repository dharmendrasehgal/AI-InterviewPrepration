import { db } from '@/db/connection'
import { expertAvailability, experts } from '@/db/schema'
import { eq, and, gte, lte, lt, gt } from 'drizzle-orm'
import type { CreateSlotDto, ListAvailabilityQuery } from './availability.schema'

export const availabilityService = {
  async addSlot(expertUserId: string, dto: CreateSlotDto) {
    const [expert] = await db
      .select({ id: experts.id, status: experts.status })
      .from(experts)
      .where(eq(experts.userId, expertUserId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert profile not found'), { code: 'NOT_FOUND', status: 404 })
    }
    if (expert.status !== 'approved') {
      throw Object.assign(new Error('Expert account is not approved'), { code: 'FORBIDDEN', status: 403 })
    }

    const startAt = new Date(dto.start_at)
    const endAt = new Date(dto.end_at)

    // Application-level overlap check (DB EXCLUDE constraint is the source of truth)
    const overlapping = await db
      .select({ id: expertAvailability.id })
      .from(expertAvailability)
      .where(
        and(
          eq(expertAvailability.expertId, expert.id),
          lt(expertAvailability.startAt, endAt),
          gt(expertAvailability.endAt, startAt),
        ),
      )
      .limit(1)

    if (overlapping.length > 0) {
      throw Object.assign(new Error('Time slot overlaps with an existing slot'), { code: 'SLOT_CONFLICT', status: 409 })
    }

    const [slot] = await db
      .insert(expertAvailability)
      .values({ expertId: expert.id, startAt, endAt, isBooked: false })
      .returning({ id: expertAvailability.id, startAt: expertAvailability.startAt, endAt: expertAvailability.endAt })

    return { slot_id: slot.id, start_at: slot.startAt, end_at: slot.endAt }
  },

  async removeSlot(expertUserId: string, slotId: string) {
    const [expert] = await db
      .select({ id: experts.id })
      .from(experts)
      .where(eq(experts.userId, expertUserId))
      .limit(1)

    if (!expert) {
      throw Object.assign(new Error('Expert profile not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const [slot] = await db
      .select({ id: expertAvailability.id, isBooked: expertAvailability.isBooked, expertId: expertAvailability.expertId })
      .from(expertAvailability)
      .where(eq(expertAvailability.id, slotId))
      .limit(1)

    if (!slot) {
      throw Object.assign(new Error('Slot not found'), { code: 'NOT_FOUND', status: 404 })
    }
    if (slot.expertId !== expert.id) {
      throw Object.assign(new Error('Cannot remove another expert\'s slot'), { code: 'FORBIDDEN', status: 403 })
    }
    if (slot.isBooked) {
      throw Object.assign(new Error('Cannot remove a booked slot'), { code: 'INVALID_STATE', status: 409 })
    }

    await db.delete(expertAvailability).where(eq(expertAvailability.id, slotId))

    return { slot_id: slotId, deleted: true }
  },

  async listByExpert(expertId: string, query: ListAvailabilityQuery) {
    const conditions = [eq(expertAvailability.expertId, expertId)]

    if (query.from) conditions.push(gte(expertAvailability.startAt, new Date(query.from)))
    if (query.to) conditions.push(lte(expertAvailability.endAt, new Date(query.to)))
    if (query.available_only) conditions.push(eq(expertAvailability.isBooked, false))

    const rows = await db
      .select()
      .from(expertAvailability)
      .where(and(...conditions))
      .orderBy(expertAvailability.startAt)

    return rows.map((s) => ({
      slot_id: s.id,
      start_at: s.startAt,
      end_at: s.endAt,
      is_booked: s.isBooked,
    }))
  },
}
