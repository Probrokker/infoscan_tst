import { prisma } from '@/lib/prisma'
import { LearningPathsClient } from './LearningPathsClient'

export const metadata = { title: 'Учебные пути — Инфоскан Admin' }

export default async function LearningPathsPage() {
  const [paths, articles] = await Promise.all([
    prisma.learningPath.findMany({
      orderBy: { order: 'asc' },
      include: { steps: { orderBy: { order: 'asc' } } },
    }),
    prisma.article.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }],
      select: { slug: true, section: { select: { slug: true } } },
    }),
  ])

  const articleSlugs = articles.map((a) => `${a.section.slug}/${a.slug}`)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Учебные пути</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Структурированные последовательности статей для разных ролей. Перетащи путь или шаги для
          изменения порядка.
        </p>
      </div>
      <LearningPathsClient paths={paths} articleSlugs={articleSlugs} />
    </div>
  )
}
