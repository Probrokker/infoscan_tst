'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import {
  createBackup,
  restoreBackup,
  deleteBackupFile,
  listBackups,
  type BackupFile,
} from '@/lib/backup'
import { recordAudit } from '@/lib/audit'
import { AuditAction } from '@prisma/client'
import { headers } from 'next/headers'
import { getClientIp } from '@/lib/rate-limit'

export type { BackupFile }

export interface BackupResult {
  ok?: boolean
  error?: string
  filename?: string
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  if (session.user.role !== 'ADMIN') throw new Error('Требуются права ADMIN')
  return session.user as { id: string; role: string }
}

export async function getBackupsAction(): Promise<BackupFile[]> {
  await requireAdmin()
  return listBackups()
}

export async function createBackupAction(): Promise<BackupResult> {
  try {
    const admin = await requireAdmin()
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) return { ok: false, error: 'DATABASE_URL не задан' }

    const filename = await createBackup(databaseUrl)

    await recordAudit({
      action: AuditAction.CREATE,
      userId: admin.id,
      entityType: 'Backup',
      ip: getClientIp(await headers()),
      details: { filename },
    })

    revalidatePath('/admin/backups')
    return { ok: true, filename }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function restoreBackupAction(filename: string): Promise<BackupResult> {
  try {
    const admin = await requireAdmin()
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) return { ok: false, error: 'DATABASE_URL не задан' }

    await restoreBackup(filename, databaseUrl)

    await recordAudit({
      action: AuditAction.UPDATE,
      userId: admin.id,
      entityType: 'Backup',
      ip: getClientIp(await headers()),
      details: { restored: filename },
    })

    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteBackupAction(filename: string): Promise<BackupResult> {
  try {
    const admin = await requireAdmin()
    await deleteBackupFile(filename)

    await recordAudit({
      action: AuditAction.DELETE,
      userId: admin.id,
      entityType: 'Backup',
      ip: getClientIp(await headers()),
      details: { filename },
    })

    revalidatePath('/admin/backups')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
