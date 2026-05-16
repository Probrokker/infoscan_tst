/**
 * Страница создания новой статьи: /admin/articles/new.
 * Серверный компонент — загружает разделы для select.
 */
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { NewArticleClient } from './NewArticleClient'

export const metadata: Metadata = { title: 'Новая статья' }

export default async function NewArticlePage() {
  const sections = await prisma.section.findMany({ orderBy: { order: 'asc' } })

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-xl font-bold">Новая статья</h1>
      <NewArticleClient
        sections={sections.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
      />
    </div>
  )
}
