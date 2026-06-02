import { pgTable, text, uuid, boolean, timestamp, integer, real, jsonb, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── Users ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  emailHash: text('email_hash').notNull().unique(),
  emailEncrypted: text('email_encrypted').notNull(),
  fullNameEncrypted: text('full_name_encrypted').notNull(),
  role: text('role')
    .$type<'candidate' | 'expert' | 'admin'>()
    .notNull()
    .default('candidate'),
  passwordHash: text('password_hash'),
  emailVerifyToken: text('email_verify_token'),
  emailVerifyExpiry: timestamp('email_verify_expiry', { withTimezone: true }),
  emailVerified: boolean('email_verified').notNull().default(false),
  status: text('status')
    .$type<'active' | 'suspended' | 'pending_verification'>()
    .notNull()
    .default('pending_verification'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Refresh Tokens ───────────────────────────────────────────────

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('refresh_tokens_user_id_idx').on(t.userId),
])

// ─── Candidate Profiles ───────────────────────────────────────────

export const candidateProfiles = pgTable('candidate_profiles', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetIndustry: text('target_industry'),
  careerLevel: text('career_level')
    .$type<'entry' | 'mid' | 'senior' | 'executive'>(),
  interviewTrack: text('interview_track')
    .$type<'behavioral' | 'technical' | 'situational' | 'mixed'>(),
  resumeS3Key: text('resume_s3_key'),
  parsedResumeJson: jsonb('parsed_resume_json'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Questions ────────────────────────────────────────────────────

export const questions = pgTable('questions', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  text: text('text').notNull(),
  type: text('type')
    .$type<'behavioral' | 'technical' | 'situational' | 'role_specific'>()
    .notNull(),
  level: text('level')
    .$type<'entry' | 'mid' | 'senior' | 'executive'>()
    .notNull(),
  industry: text('industry').notNull().default('general'),
  difficulty: integer('difficulty').notNull().default(3),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  framework: text('framework'),
  status: text('status')
    .$type<'draft' | 'published' | 'archived'>()
    .notNull()
    .default('published'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('questions_type_idx').on(t.type),
  index('questions_level_idx').on(t.level),
  index('questions_industry_idx').on(t.industry),
  index('questions_status_idx').on(t.status),
])

// ─── Question Answers ─────────────────────────────────────────────

export const questionAnswers = pgTable('question_answers', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  answerText: text('answer_text').notNull(),
  keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('question_answers_question_id_idx').on(t.questionId),
])

// ─── Bookmarks ────────────────────────────────────────────────────

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('bookmarks_user_id_idx').on(t.userId),
  index('bookmarks_user_question_idx').on(t.userId, t.questionId),
])

// ─── Mock Sessions ────────────────────────────────────────────────

export const mockSessions = pgTable('mock_sessions', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: text('status')
    .$type<'awaiting_consent' | 'in_progress' | 'processing' | 'scored' | 'failed'>()
    .notNull()
    .default('awaiting_consent'),
  questionCount: integer('question_count').notNull(),
  track: text('track').notNull(),
  level: text('level').notNull(),
  compositeScore: integer('composite_score'),
  avgWpm: integer('avg_wpm'),
  totalFillers: integer('total_fillers'),
  consentLoggedAt: timestamp('consent_logged_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('mock_sessions_user_id_idx').on(t.userId),
  index('mock_sessions_status_idx').on(t.status),
])

// ─── Session Responses ────────────────────────────────────────────

export const sessionResponses = pgTable('session_responses', {
  id: uuid('id')
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => mockSessions.id),
  responseIndex: integer('response_index').notNull(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id),
  transcript: text('transcript'),
  durationSeconds: integer('duration_seconds'),
  speechRateWpm: integer('speech_rate_wpm'),
  fillerWordCount: integer('filler_word_count'),
  fillerPercentage: real('filler_percentage'),
  keywordRelevance: integer('keyword_relevance'),
  clarityScore: integer('clarity_score'),
  improvementTip: text('improvement_tip'),
  scoredAt: timestamp('scored_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('session_responses_session_id_idx').on(t.sessionId),
])
