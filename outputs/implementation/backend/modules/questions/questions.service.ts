import { db } from '@/db/connection'
import { questions, questionAnswers, bookmarks } from '@/db/schema'
import { eq, and, ilike, inArray, sql } from 'drizzle-orm'

export interface QuestionFilter {
  type?: string
  level?: string
  industry?: string
  tag?: string
  cursor?: string
  page_size?: number
  userId?: string
}

export const questionsService = {
  async list(filter: QuestionFilter) {
    const pageSize = Math.min(filter.page_size ?? 25, 100)

    const conditions = [eq(questions.status, 'published')]

    if (filter.type) conditions.push(eq(questions.type, filter.type as never))
    if (filter.level) conditions.push(eq(questions.level, filter.level as never))
    if (filter.industry) conditions.push(eq(questions.industry, filter.industry))

    // cursor-based pagination by id
    if (filter.cursor) {
      conditions.push(sql`${questions.id} > ${filter.cursor}`)
    }

    const rows = await db
      .select({
        id: questions.id,
        text: questions.text,
        type: questions.type,
        level: questions.level,
        industry: questions.industry,
        difficulty: questions.difficulty,
        tags: questions.tags,
        framework: questions.framework,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(and(...conditions))
      .orderBy(questions.id)
      .limit(pageSize + 1)

    const hasMore = rows.length > pageSize
    const items = rows.slice(0, pageSize)

    // Fetch bookmarks for authenticated user
    let bookmarkedIds = new Set<string>()
    if (filter.userId) {
      const bmarks = await db
        .select({ questionId: bookmarks.questionId })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, filter.userId),
            inArray(bookmarks.questionId, items.map((r) => r.id)),
          ),
        )
      bookmarkedIds = new Set(bmarks.map((b) => b.questionId))
    }

    // Filter by tag in application layer (JSONB contains check)
    let filtered = items
    if (filter.tag) {
      const tag = filter.tag.toLowerCase()
      filtered = items.filter((q) => {
        const tags = (q.tags ?? []) as string[]
        return tags.some((t) => t.toLowerCase() === tag)
      })
    }

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(eq(questions.status, 'published'))
      .then((r) => Number(r[0]?.count ?? 0))

    return {
      items: filtered.map((q) => ({
        ...q,
        tags: (q.tags ?? []) as string[],
        bookmarked: bookmarkedIds.has(q.id),
      })),
      next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      has_more: hasMore,
      total,
    }
  },

  async get(id: string, userId?: string) {
    const [question] = await db
      .select()
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.status, 'published')))
      .limit(1)

    if (!question) {
      throw Object.assign(new Error('Question not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const answers = await db
      .select()
      .from(questionAnswers)
      .where(eq(questionAnswers.questionId, id))

    let bookmarked = false
    if (userId) {
      const [bmark] = await db
        .select({ id: bookmarks.id })
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, id)))
        .limit(1)
      bookmarked = !!bmark
    }

    return {
      id: question.id,
      text: question.text,
      type: question.type,
      level: question.level,
      industry: question.industry,
      difficulty: question.difficulty,
      tags: (question.tags ?? []) as string[],
      framework: question.framework,
      bookmarked,
      answers: answers.map((a) => ({
        id: a.id,
        answer_text: a.answerText,
        keywords: (a.keywords ?? []) as string[],
        is_primary: a.isPrimary,
      })),
    }
  },

  async search(q: string, suggest: boolean) {
    const term = `%${q}%`

    const results = await db
      .select({
        id: questions.id,
        text: questions.text,
        type: questions.type,
        level: questions.level,
        industry: questions.industry,
        difficulty: questions.difficulty,
        tags: questions.tags,
        framework: questions.framework,
      })
      .from(questions)
      .where(and(eq(questions.status, 'published'), ilike(questions.text, term)))
      .limit(suggest ? 5 : 20)

    const suggestions = suggest
      ? results.slice(0, 5).map((r) => r.text.slice(0, 80))
      : []

    return {
      suggestions,
      results: results.map((q) => ({ ...q, tags: (q.tags ?? []) as string[], bookmarked: false })),
    }
  },

  async bookmark(userId: string, questionId: string) {
    const [q] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1)

    if (!q) {
      throw Object.assign(new Error('Question not found'), { code: 'NOT_FOUND', status: 404 })
    }

    await db
      .insert(bookmarks)
      .values({ userId, questionId })
      .onConflictDoNothing()
  },

  async unbookmark(userId: string, questionId: string) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.questionId, questionId)))
  },

  async getBookmarked(userId: string) {
    const bmarks = await db
      .select({ questionId: bookmarks.questionId })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))

    if (bmarks.length === 0) return []

    const ids = bmarks.map((b) => b.questionId)
    const rows = await db
      .select()
      .from(questions)
      .where(and(inArray(questions.id, ids), eq(questions.status, 'published')))

    return rows.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      level: q.level,
      industry: q.industry,
      difficulty: q.difficulty,
      tags: (q.tags ?? []) as string[],
      framework: q.framework,
      bookmarked: true,
    }))
  },

  async adminCreate(dto: {
    text: string; type: string; level: string; industry?: string
    difficulty?: number; tags?: string[]; framework?: string
    answer?: string; keywords?: string[]
  }) {
    const [row] = await db
      .insert(questions)
      .values({
        text: dto.text,
        type: dto.type as never,
        level: dto.level as never,
        industry: dto.industry ?? 'general',
        difficulty: dto.difficulty ?? 3,
        tags: dto.tags ?? [],
        framework: dto.framework ?? null,
        status: 'published',
      })
      .returning()

    if (dto.answer) {
      await db.insert(questionAnswers).values({
        questionId: row.id,
        answerText: dto.answer,
        keywords: dto.keywords ?? [],
        isPrimary: true,
      })
    }

    return { question_id: row.id, text: row.text, status: row.status }
  },

  async adminUpdate(id: string, dto: Partial<{
    text: string; type: string; level: string; industry: string
    difficulty: number; tags: string[]; framework: string; status: string
  }>) {
    const [q] = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, id)).limit(1)
    if (!q) throw Object.assign(new Error('Question not found'), { code: 'NOT_FOUND', status: 404 })

    const update: Record<string, unknown> = {}
    if (dto.text !== undefined) update.text = dto.text
    if (dto.type !== undefined) update.type = dto.type
    if (dto.level !== undefined) update.level = dto.level
    if (dto.industry !== undefined) update.industry = dto.industry
    if (dto.difficulty !== undefined) update.difficulty = dto.difficulty
    if (dto.tags !== undefined) update.tags = dto.tags
    if (dto.framework !== undefined) update.framework = dto.framework
    if (dto.status !== undefined) update.status = dto.status

    const [updated] = await db.update(questions).set(update).where(eq(questions.id, id)).returning()
    return { question_id: updated.id, text: updated.text, status: updated.status }
  },

  async adminDelete(id: string) {
    const [q] = await db.select({ id: questions.id }).from(questions).where(eq(questions.id, id)).limit(1)
    if (!q) throw Object.assign(new Error('Question not found'), { code: 'NOT_FOUND', status: 404 })
    await db.delete(questions).where(eq(questions.id, id))
  },
}
