import { pgTable, text, uuid, boolean, timestamp, integer, smallint, real, jsonb, index } from 'drizzle-orm/pg-core'
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

// ─── Phase 2: Experts ─────────────────────────────────────────────

export const experts = pgTable('experts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bioEncrypted: text('bio_encrypted').notNull(),
  headline: text('headline').notNull(),
  industry: text('industry')
    .$type<'general_career' | 'software_engineering' | 'medical'>()
    .notNull(),
  track: text('track')
    .$type<'general_career' | 'software_engineering' | 'medical'>()
    .notNull(),
  yearsExp: smallint('years_exp').notNull(),
  rateCents: integer('rate_cents').notNull().default(0),
  status: text('status')
    .$type<'pending' | 'approved' | 'suspended'>()
    .notNull()
    .default('pending'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('experts_status_track_idx').on(t.status, t.track),
  index('experts_user_id_idx').on(t.userId),
])

// ─── Phase 2: Expert Availability ─────────────────────────────────

export const expertAvailability = pgTable('expert_availability', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  expertId: uuid('expert_id').notNull().references(() => experts.id, { onDelete: 'cascade' }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  isBooked: boolean('is_booked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('expert_avail_expert_start_idx').on(t.expertId, t.startAt),
])

// ─── Phase 2: Bookings ────────────────────────────────────────────

export const bookings = pgTable('bookings', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  candidateId: uuid('candidate_id').notNull().references(() => users.id),
  expertId: uuid('expert_id').notNull().references(() => experts.id),
  availabilityId: uuid('availability_id').notNull().unique().references(() => expertAvailability.id),
  status: text('status')
    .$type<'confirmed' | 'cancelled' | 'completed' | 'no_show'>()
    .notNull()
    .default('confirmed'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('bookings_candidate_idx').on(t.candidateId),
  index('bookings_expert_idx').on(t.expertId),
])

// ─── Phase 2: Expert Sessions ─────────────────────────────────────

export const expertSessions = pgTable('expert_sessions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  bookingId: uuid('booking_id').notNull().unique().references(() => bookings.id),
  recordingKey: text('recording_key'),
  transcript: text('transcript'),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  status: text('status')
    .$type<'pending' | 'in_progress' | 'completed' | 'failed'>()
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('expert_sessions_booking_idx').on(t.bookingId),
])

// ─── Phase 2: Rubric Evaluations ──────────────────────────────────

export const rubricEvaluations = pgTable('rubric_evaluations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  expertSessionId: uuid('expert_session_id').notNull().unique().references(() => expertSessions.id),
  expertId: uuid('expert_id').notNull().references(() => experts.id),
  communication: integer('communication').notNull(),
  technicalDepth: integer('technical_depth').notNull(),
  structuredThinking: integer('structured_thinking').notNull(),
  confidence: integer('confidence').notNull(),
  notesEncrypted: text('notes_encrypted'),
  feedbackText: text('feedback_text').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('rubric_session_idx').on(t.expertSessionId),
])

// ─── Phase 2: Playbooks ───────────────────────────────────────────

export const playbooks = pgTable('playbooks', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  track: text('track')
    .$type<'general_career' | 'software_engineering' | 'medical'>()
    .notNull()
    .unique(),
  title: text('title').notNull(),
  content: jsonb('content')
    .$type<{ sections: Array<{ title: string; body: string; questions: string[] }> }>()
    .notNull(),
  version: integer('version').notNull().default(1),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

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
