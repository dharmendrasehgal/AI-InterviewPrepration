import { db } from '@/db/connection'
import { playbooks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { CreatePlaybookDto, UpdatePlaybookDto } from './playbooks.schema'

export const playbooksService = {
  async list() {
    const rows = await db
      .select({ id: playbooks.id, track: playbooks.track, title: playbooks.title, version: playbooks.version })
      .from(playbooks)
      .where(eq(playbooks.published, true))

    return rows.map((p) => ({ playbook_id: p.id, track: p.track, title: p.title, version: p.version }))
  },

  async get(track: string) {
    const [playbook] = await db
      .select()
      .from(playbooks)
      .where(eq(playbooks.track, track as 'general_career' | 'software_engineering' | 'medical'))
      .limit(1)

    if (!playbook || !playbook.published) {
      throw Object.assign(new Error('Playbook not found'), { code: 'NOT_FOUND', status: 404 })
    }

    return {
      playbook_id: playbook.id,
      track: playbook.track,
      title: playbook.title,
      version: playbook.version,
      sections: playbook.content.sections,
    }
  },

  async create(dto: CreatePlaybookDto) {
    const [playbook] = await db
      .insert(playbooks)
      .values({
        track: dto.track,
        title: dto.title,
        content: { sections: dto.sections },
        published: false,
      })
      .returning({ id: playbooks.id, track: playbooks.track })

    return { playbook_id: playbook.id, track: playbook.track, published: false }
  },

  async update(track: string, dto: UpdatePlaybookDto) {
    const [existing] = await db
      .select({ id: playbooks.id, content: playbooks.content, version: playbooks.version })
      .from(playbooks)
      .where(eq(playbooks.track, track as 'general_career' | 'software_engineering' | 'medical'))
      .limit(1)

    if (!existing) {
      throw Object.assign(new Error('Playbook not found'), { code: 'NOT_FOUND', status: 404 })
    }

    const newContent = dto.sections
      ? { sections: dto.sections }
      : existing.content

    await db
      .update(playbooks)
      .set({
        ...(dto.title ? { title: dto.title } : {}),
        content: newContent,
        version: existing.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(playbooks.track, track as 'general_career' | 'software_engineering' | 'medical'))

    return { track, updated: true, version: existing.version + 1 }
  },

  async publish(track: string) {
    const result = await db
      .update(playbooks)
      .set({ published: true, updatedAt: new Date() })
      .where(eq(playbooks.track, track as 'general_career' | 'software_engineering' | 'medical'))
      .returning({ id: playbooks.id })

    if (result.length === 0) {
      throw Object.assign(new Error('Playbook not found'), { code: 'NOT_FOUND', status: 404 })
    }

    return { track, published: true }
  },
}
