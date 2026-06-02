import { logger } from '@/lib/logger'

export interface AuditEntry {
  action: string
  targetType: string
  targetId: string
  actorId?: string
  metadata?: Record<string, unknown>
}

export const auditLog = {
  async record(entry: AuditEntry): Promise<void> {
    logger.info(
      { audit: entry },
      `[audit] ${entry.action} on ${entry.targetType}:${entry.targetId}`,
    )
    // TODO: insert into audit_log table (INSERT-only, no UPDATE/DELETE)
  },
}
