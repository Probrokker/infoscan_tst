/**
 * Страница редактирования метаданных статьи: /admin/articles/[id]/edit.
 * MDX-редактор тела появится на шаге 6 — пока показываем "Редактор MDX придёт на шаге 6".
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ArticleEditForm } from './ArticleEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const article = await prisma.article.findUnique({ where: { id }, select: { title: true } })
  return { title: article ? `Редактировать: ${article.title}` : 'Редактировать статью' }
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const article = await prisma.article.findUnique({
    where: { id, deletedAt: null },
    include: { section: true },
  })
  if (!article) notFound()

  const sections = await prisma.section.findMany({ orderBy: { order: 'asc' } })

  const versions = await prisma.articleVersion.findMany({
    where: { articleId: id },
    orderBy: { version: 'desc' },
    take: 10,
    select: {
      id: true,
      version: true,
      createdAt: true,
      comment: true,
      author: { select: { name: true } },
    },
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/articles"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          ← Все статьи
        </Link>
        <span className="text-[var(--muted-foreground)]">/</span>
        <h1 className="max-w-sm truncate text-xl font-bold">{article.title}</h1>
      </div>

      <ArticleEditForm
        article={{
          id: article.id,
          title: article.title,
          description: article.description,
          sectionId: article.sectionId,
          slug: article.slug,
          fullSlug: `${article.section.slug}/${article.slug}`,
          audience: article.audience,
          order: article.order,
          status: article.status,
          related: article.related,
          body: article.body,
        }}
        sections={sections.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
        versions={versions.map((v) => ({
          id: v.id,
          version: v.version,
          createdAt: v.createdAt.toISOString(),
          ...(v.comment ? { comment: v.comment } : {}),
          ...(v.author?.name ? { authorName: v.author.name } : {}),
        }))}
      />
    </div>
  )
}
