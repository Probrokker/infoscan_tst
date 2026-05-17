'use server'

/**
 * Серверные actions общего назначения для админки.
 */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { recordAudit, AuditAction } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

export async function logoutAction(): Promise<void> {
  const session = await auth()
  const reqHeaders = await headers()
  const ip = getClientIp(reqHeaders)

  if (session?.user?.id) {
    await recordAudit({
      action: AuditAction.LOGOUT,
      userId: session.user.id,
      entityType: 'User',
      entityId: session.user.id,
      ip,
    })
  }

  await signOut({ redirect: false })
  redirect('/admin/login')
}
