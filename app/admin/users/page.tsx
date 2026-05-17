import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Пользователи — Инфоскан Admin' }

export default async function UsersPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/admin')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { articles: { where: { deletedAt: null } } } },
    },
  })

  const currentUserId = session.user.id!

  // Сериализуем даты в строки для клиентского компонента
  const serialized = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Управление доступом. Деактивированные пользователи не могут войти в систему.
        </p>
      </div>
      <UsersClient users={serialized} currentUserId={currentUserId} />
    </div>
  )
}
