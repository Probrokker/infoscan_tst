/**
 * Дашборд админ-панели — заглушка для шага 4.
 * На шаге 5 наполним статистикой (всего статей, черновики, недавние правки)
 * и быстрыми действиями.
 */
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ArticleStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Дашборд',
}

export default async function AdminDashboardPage() {
  const session = await auth()
  const userName = session?.user?.name ?? session?.user?.email ?? ''

  const [total, published, drafts] = await Promise.all([
    prisma.article.count({ where: { deletedAt: null } }),
    prisma.article.count({ where: { deletedAt: null, status: ArticleStatus.PUBLISHED } }),
    prisma.article.count({ where: { deletedAt: null, status: ArticleStatus.DRAFT } }),
  ])

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Привет, {userName}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Админ-панель Инфоскан. На шаге 5 здесь появится Cmd+K и быстрые действия.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Всего статей" value={total} />
        <Stat label="Опубликовано" value={published} />
        <Stat label="Черновики" value={drafts} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border bg-[var(--card)] p-5">
      <div className="text-xs tracking-wide text-[var(--muted-foreground)] uppercase">{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
