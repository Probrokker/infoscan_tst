import { prisma } from '@/lib/prisma'
import { SectionsClient } from './SectionsClient'

export const metadata = { title: 'Разделы — Инфоскан Admin' }

export default async function SectionsPage() {
  const sections = await prisma.section.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { articles: { where: { deletedAt: null } } } } },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Разделы</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Перетащи строку за рукоятку чтобы изменить порядок. Нельзя удалить раздел со статьями.
        </p>
      </div>
      <SectionsClient sections={sections} />
    </div>
  )
}
