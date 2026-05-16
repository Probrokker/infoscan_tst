/**
 * Запись в AuditLog. Для шага 4 — только события auth.*.
 * На шаге 8 расширим на все CRUD-действия.
 */
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface AuditPayload {
  action: AuditAction
  userId?: string | null
  entityType: string
  entityId?: string | null
  ip?: string | null
  details?: Record<string, unknown>
}

export async function recordAudit(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: payload.action,
        userId: payload.userId ?? null,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        ip: payload.ip ?? null,
        ...(payload.details ? { details: payload.details as object } : {}),
      },
    })
  } catch (error) {
    // Логирование падения аудита не должно валить основной поток.
    console.error('[audit] failed to write log:', error)
  }
}

export { AuditAction }
