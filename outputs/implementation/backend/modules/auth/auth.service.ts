import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { db } from '@/db/connection'
import { users, refreshTokens } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { emailService } from '@/modules/notification/email.service'
import { auditLog } from '@/modules/admin/audit.service'
import type { RegisterDto, LoginDto } from './auth.schema'

const BCRYPT_ROUNDS = 12
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL_DAYS = 30

export interface AuthTokens {
  access_token: string
  expires_in: number
}

export const authService = {
  async register(dto: RegisterDto) {
    const emailHash = hashEmail(dto.email)

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailHash, emailHash))
      .limit(1)

    if (existing.length > 0) {
      throw Object.assign(new Error('Email already registered'), { code: 'EMAIL_EXISTS', status: 409 })
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const isDev = process.env.NODE_ENV !== 'production'
    const verifyToken = isDev ? null : crypto.randomBytes(32).toString('hex')

    const [user] = await db
      .insert(users)
      .values({
        emailHash,
        emailEncrypted: encryptField(dto.email),
        fullNameEncrypted: encryptField(dto.full_name),
        role: dto.role,
        passwordHash,
        // In dev: auto-verify so the register→login flow works without an email provider
        emailVerified: isDev,
        status: isDev ? 'active' : 'pending_verification',
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      })
      .returning({ id: users.id, role: users.role })

    if (!isDev) {
      await emailService.sendVerificationEmail(dto.email, verifyToken!)
    }

    return { user_id: user.id, email: dto.email, role: user.role }
  },

  async login(dto: LoginDto, ipAddress: string) {
    const emailHash = hashEmail(dto.email)

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailHash, emailHash))
      .limit(1)

    if (!user) {
      await bcrypt.compare(dto.password, '$2b$12$invalidhashpadding000000000000000000000000000000000000')
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 })
    }

    if (user.status === 'suspended') {
      throw Object.assign(new Error('Account suspended'), { code: 'ACCOUNT_SUSPENDED', status: 403 })
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash!)
    if (!valid) {
      await auditLog.record({ action: 'auth.login_failed', targetType: 'user', targetId: user.id, metadata: { ip: ipAddress } })
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 })
    }

    if (!user.emailVerified) {
      throw Object.assign(new Error('Email not verified'), { code: 'EMAIL_NOT_VERIFIED', status: 403 })
    }

    const tokens = await this.issueTokens(user.id, user.role)
    return {
      ...tokens,
      user: { user_id: user.id, role: user.role, email_verified: user.emailVerified },
    }
  },

  async verifyEmail(token: string) {
    const [user] = await db
      .select({ id: users.id, expiry: users.emailVerifyExpiry })
      .from(users)
      .where(eq(users.emailVerifyToken, token))
      .limit(1)

    if (!user || !user.expiry || user.expiry < new Date()) {
      throw Object.assign(new Error('Token invalid or expired'), { code: 'INVALID_TOKEN', status: 400 })
    }

    await db
      .update(users)
      .set({ emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null, status: 'active' })
      .where(eq(users.id, user.id))

    return { verified: true }
  },

  async refreshTokens(rawToken: string) {
    const tokenHash = hashToken(rawToken)
    const now = new Date()

    const [stored] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .limit(1)

    if (!stored || stored.revokedAt) {
      throw Object.assign(new Error('Invalid refresh token'), { code: 'INVALID_TOKEN', status: 401 })
    }

    const [user] = await db
      .select({ id: users.id, role: users.role, status: users.status })
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1)

    if (!user || user.status !== 'active') {
      throw Object.assign(new Error('User not found or inactive'), { code: 'UNAUTHORIZED', status: 401 })
    }

    // Rotate: revoke current token, issue new pair
    await db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, stored.id))

    return this.issueTokens(user.id, user.role)
  },

  async logout(rawToken: string) {
    const tokenHash = hashToken(rawToken)
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash))
  },

  async issueTokens(userId: string, role: string): Promise<AuthTokens & { refresh_token: string }> {
    const privateKey = getPrivateKey()
    const accessToken = jwt.sign(
      { sub: userId, role },
      privateKey,
      { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_TTL },
    )

    const rawRefresh = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({
      userId,
      tokenHash: hashToken(rawRefresh),
      expiresAt,
    })

    return {
      access_token: accessToken,
      expires_in: 900,
      refresh_token: rawRefresh,
    }
  },
}

// ─── Helpers ──────────────────────────────────────────────────────

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function encryptField(value: string): string {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY ?? '0'.repeat(64)
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

let _privateKey: string | null = null
function getPrivateKey(): string {
  if (_privateKey) return _privateKey
  if (process.env.JWT_PRIVATE_KEY) {
    _privateKey = process.env.JWT_PRIVATE_KEY
    return _privateKey
  }
  const keyFile = process.env.JWT_PRIVATE_KEY_FILE
  if (keyFile) {
    const { readFileSync } = require('node:fs')
    _privateKey = readFileSync(keyFile, 'utf8')
    return _privateKey!
  }
  throw new Error('JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_FILE must be set')
}

export function verifyAccessToken(token: string): { sub: string; role: string } {
  try {
    const privateKey = getPrivateKey()
    return jwt.verify(token, privateKey, { algorithms: ['RS256'] }) as { sub: string; role: string }
  } catch {
    throw Object.assign(new Error('Invalid access token'), { code: 'UNAUTHORIZED', status: 401 })
  }
}
