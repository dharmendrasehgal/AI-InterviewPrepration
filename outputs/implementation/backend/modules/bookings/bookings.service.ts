import { db } from '@/db/connection'
import { bookings, expertAvailability, expertSessions, experts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { emailService } from '@/modules/notification/email.service'
import type { CreateBookingDto, CancelBookingDto } from './bookings.schema'

export const bookingsService = {
  async create(candidateId: string, dto: CreateBookingDto) {
    return db.transaction(async (tx) => {
      // Lock the availability row for update to prevent double-booking
      const [slot] = await tx
        .select()
        .from(expertAvailability)
        .where(
          and(
            eq(expertAvailability.id, dto.availability_id),
            eq(expertAvailability.expertId, dto.expert_id),
            eq(expertAvailability.isBooked, false),
          ),
        )
        .for('update')
        .limit(1)

      if (!slot) {
        throw Object.assign(new Error('Slot is not available'), { code: 'SLOT_UNAVAILABLE', status: 409 })
      }

      await tx
        .update(expertAvailability)
        .set({ isBooked: true })
        .where(eq(expertAvailability.id, dto.availability_id))

      const [booking] = await tx
        .insert(bookings)
        .values({
          candidateId,
          expertId: dto.expert_id,
          availabilityId: dto.availability_id,
          status: 'confirmed',
        })
        .returning()

      // Create the corresponding expert_sessions record immediately
      await tx
        .insert(expertSessions)
        .values({ bookingId: booking.id, status: 'pending' })

      return {
        booking_id: booking.id,
        status: booking.status,
        start_at: slot.startAt,
        end_at: slot.endAt,
        expert_id: dto.expert_id,
      }
    })
  },

  async cancel(bookingId: string, requestingUserId: string, dto: CancelBookingDto) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      throw Object.assign(new Error('Booking not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const isCandidate = booking.candidateId === requestingUserId
    const [expert] = await db
      .select({ userId: experts.userId })
      .from(experts)
      .where(eq(experts.id, booking.expertId))
      .limit(1)
    const isExpert = expert?.userId === requestingUserId

    if (!isCandidate && !isExpert) {
      throw Object.assign(new Error('Cannot cancel this booking'), { code: 'FORBIDDEN', status: 403 })
    }
    if (booking.status !== 'confirmed') {
      throw Object.assign(new Error('Only confirmed bookings can be cancelled'), { code: 'INVALID_STATE', status: 400 })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          cancelledBy: requestingUserId,
          cancelReason: dto.reason ?? null,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))

      await tx
        .update(expertAvailability)
        .set({ isBooked: false })
        .where(eq(expertAvailability.id, booking.availabilityId))
    })

    // Fire-and-forget notification (stub)
    emailService.sendCancellationEmail('', bookingId).catch(() => undefined)

    return { booking_id: bookingId, status: 'cancelled' }
  },

  async get(bookingId: string, requestingUserId: string) {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      throw Object.assign(new Error('Booking not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const [expert] = await db
      .select({ userId: experts.userId })
      .from(experts)
      .where(eq(experts.id, booking.expertId))
      .limit(1)

    const isCandidate = booking.candidateId === requestingUserId
    const isExpert = expert?.userId === requestingUserId

    if (!isCandidate && !isExpert) {
      throw Object.assign(new Error('Access denied'), { code: 'FORBIDDEN', status: 403 })
    }

    return {
      booking_id: booking.id,
      status: booking.status,
      expert_id: booking.expertId,
      candidate_id: booking.candidateId,
      availability_id: booking.availabilityId,
      created_at: booking.createdAt,
    }
  },

  async listByCandidate(candidateId: string) {
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.candidateId, candidateId))
      .orderBy(bookings.createdAt)

    return rows.map((b) => ({
      booking_id: b.id,
      status: b.status,
      expert_id: b.expertId,
      availability_id: b.availabilityId,
      created_at: b.createdAt,
    }))
  },

  async complete(bookingId: string) {
    await db
      .update(bookings)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
  },
}
