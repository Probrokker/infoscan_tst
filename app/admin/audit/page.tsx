import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AuditClient } from './AuditClient'
import { AuditAction } from '@prisma/client'

export const metadata = { title: 'Аудит — Инфоскан Admin' }

const PAGE_SIZE = 50

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/admin')

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))
  const action = typeof sp.action === 'string' ? (sp.action as AuditAction) : undefined
  const entityType = typeof sp.entityType === 'string' ? sp.entityType : undefined
  const userId = typeof sp.userId === 'string' ? sp.userId : undefined

  const where = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(userId ? { userId } : {}),
  }

  const [total, logs, users] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId ?? null,
    ip: l.ip ?? null,
    createdAt: l.createdAt.toISOString(),
    details: l.details ? JSON.stringify(l.details) : null,
    userName: l.user?.name ?? null,
    userEmail: l.user?.email ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Журнал аудита</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Все действия в системе. Только чтение.
        </p>
      </div>
      <AuditClient
        logs={serialized}
        users={users}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        filterAction={action ?? ''}
        filterEntityType={entityType ?? ''}
        filterUserId={userId ?? ''}
      />
    </div>
  )
}
