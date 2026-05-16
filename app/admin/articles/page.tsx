/**
 * Список статей в адмнике: /admin/articles.
 * Поиск, фильтр по статусу/разделу — через searchParams (SSR-friendly).
 * Пагинация простая: limit/offset.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ArticleStatus, type Audience } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { SECTIONS } from '@/lib/constants'
import { ArticleRow } from './ArticleRow'

export const metadata: Metadata = { title: 'Статьи' }

const PAGE_SIZE = 30

const AUDIENCE_LABEL: Record<Audience, string> = {
  OPERATOR: 'Оператор',
  ADMIN_AUDIENCE: 'Администратор',
  DEVELOPER: 'Разработчик',
}

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    section?: string
    page?: string
  }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const statusFilter =
    sp.status && Object.values(ArticleStatus).includes(sp.status as ArticleStatus)
      ? (sp.status as ArticleStatus)
      : undefined
  const sectionFilter = sp.section ?? undefined
  const page = Math.max(1, Number(sp.page ?? 1))

  const sections = await prisma.section.findMany({ orderBy: { order: 'asc' } })

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sectionFilter ? { section: { slug: sectionFilter } } : {}),
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        section: { select: { slug: true, title: true } },
        author: { select: { name: true } },
      },
      orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.article.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Статьи</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{total} статей</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-yellow-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-black-brand)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Новая статья
        </Link>
      </div>

      {/* Фильтры */}
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по заголовку / slug..."
          className="min-w-40 flex-1 rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ''}
          className="rounded-[var(--radius-input)] border bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
        >
          <option value="">Все статусы</option>
          <option value={ArticleStatus.PUBLISHED}>Опубликовано</option>
          <option value={ArticleStatus.DRAFT}>Черновик</option>
          <option value={ArticleStatus.ARCHIVED}>Архив</option>
        </select>
        <select
          name="section"
          defaultValue={sectionFilter ?? ''}
          className="rounded-[var(--radius-input)] border bg-[var(--background)] px-2 py-1.5 text-sm outline-none"
        >
          <option value="">Все разделы</option>
          {sections.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-[var(--radius-btn)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          Найти
        </button>
        {(q || statusFilter || sectionFilter) && (
          <Link
            href="/admin/articles"
            className="rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            Сбросить
          </Link>
        )}
      </form>

      {/* Таблица */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            {q || statusFilter || sectionFilter ? 'Ничего не найдено.' : 'Нет статей.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-[var(--muted)] text-xs text-[var(--muted-foreground)] uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Статья</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Раздел</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Статус</th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Аудитория</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {articles.map((article) => {
                const sectionInfo = SECTIONS.find((s) => s.id === article.section.slug)
                return (
                  <ArticleRow
                    key={article.id}
                    article={{
                      id: article.id,
                      title: article.title,
                      slug: article.slug,
                      fullSlug: `${article.section.slug}/${article.slug}`,
                      sectionTitle: sectionInfo?.title ?? article.section.title,
                      status: article.status,
                      audience: article.audience.map((a) => AUDIENCE_LABEL[a]).join(', '),
                      updatedAt: article.updatedAt.toISOString(),
                    }}
                  />
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">
            Страница {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/articles?${new URLSearchParams({ ...(q ? { q } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(sectionFilter ? { section: sectionFilter } : {}), page: String(page - 1) })}`}
                className="rounded-[var(--radius-btn)] border px-3 py-1.5 hover:bg-[var(--accent)]"
              >
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/articles?${new URLSearchParams({ ...(q ? { q } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(sectionFilter ? { section: sectionFilter } : {}), page: String(page + 1) })}`}
                className="rounded-[var(--radius-btn)] border px-3 py-1.5 hover:bg-[var(--accent)]"
              >
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
