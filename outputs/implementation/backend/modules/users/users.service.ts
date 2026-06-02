import crypto from 'node:crypto'
import { db } from '@/db/connection'
import { users, candidateProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export interface ProfileUpdate {
  full_name?: string
  target_industry?: string
  career_level?: 'entry' | 'mid' | 'senior' | 'executive'
  interview_track?: 'behavioral' | 'technical' | 'situational' | 'mixed'
}

export const usersService = {
  async getMe(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        emailVerified: users.emailVerified,
        status: users.status,
        createdAt: users.createdAt,
        emailEncrypted: users.emailEncrypted,
        fullNameEncrypted: users.fullNameEncrypted,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1)

    return {
      user_id: user.id,
      email: decryptField(user.emailEncrypted),
      full_name: decryptField(user.fullNameEncrypted),
      role: user.role,
      email_verified: user.emailVerified,
      status: user.status,
      created_at: user.createdAt,
      profile: profile
        ? {
            target_industry: profile.targetIndustry,
            career_level: profile.careerLevel,
            interview_track: profile.interviewTrack,
            has_resume: !!profile.resumeS3Key,
          }
        : null,
    }
  },

  async updateMe(userId: string, dto: ProfileUpdate) {
    // Update full_name on users table if provided
    if (dto.full_name) {
      await db
        .update(users)
        .set({ fullNameEncrypted: encryptField(dto.full_name), updatedAt: new Date() })
        .where(eq(users.id, userId))
    }

    // Upsert candidate profile
    const profileData = {
      userId,
      ...(dto.target_industry && { targetIndustry: dto.target_industry }),
      ...(dto.career_level && { careerLevel: dto.career_level }),
      ...(dto.interview_track && { interviewTrack: dto.interview_track }),
      updatedAt: new Date(),
    }

    const [existing] = await db
      .select({ id: candidateProfiles.id })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1)

    if (existing) {
      await db
        .update(candidateProfiles)
        .set(profileData)
        .where(eq(candidateProfiles.userId, userId))
    } else {
      await db.insert(candidateProfiles).values(profileData)
    }

    return this.getMe(userId)
  },

  async saveResumeKey(userId: string, s3Key: string) {
    const [existing] = await db
      .select({ id: candidateProfiles.id })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1)

    if (existing) {
      await db
        .update(candidateProfiles)
        .set({ resumeS3Key: s3Key, updatedAt: new Date() })
        .where(eq(candidateProfiles.userId, userId))
    } else {
      await db.insert(candidateProfiles).values({ userId, resumeS3Key: s3Key, updatedAt: new Date() })
    }
  },
}

// ─── Helpers ──────────────────────────────────────────────────────

function encryptField(value: string): string {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY ?? '0'.repeat(64)
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

function decryptField(encoded: string): string {
  try {
    const keyHex = process.env.FIELD_ENCRYPTION_KEY ?? '0'.repeat(64)
    const key = Buffer.from(keyHex, 'hex')
    const buf = Buffer.from(encoded, 'base64')
    const iv = buf.subarray(0, 12)
    const authTag = buf.subarray(12, 28)
    const ciphertext = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    return '[encrypted]'
  }
}
