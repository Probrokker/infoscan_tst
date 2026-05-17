/**
 * Работа с контентом — теперь с чтением из БД (Postgres через Prisma).
 *
 * До шага 3 источником правды были MDX-файлы в content/. Теперь — таблицы
 * Section/Article. Публичный API сохраняет имена и форму данных, но все
 * функции стали асинхронными.
 *
 * Кеширование:
 *   - getSidebar / getPublishedPages кешируются по тегу 'sidebar'.
 *   - getPageBySlug кеширует одну статью по тегу 'article:<sectionSlug>/<slug>'.
 * Server actions админки на шаге 6 будут вызывать revalidateTag после
 * публикации/правки.
 */
import { unstable_cache } from 'next/cache'
import { z } from 'zod'
import { ArticleStatus, Audience as AudienceEnum } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { SECTIONS, type Audience } from '@/lib/constants'

// ---- Frontmatter и Zod-схема (для совместимости с прежним API) ----

const audienceSchema = z.enum(['operator', 'admin', 'developer'])

export const frontmatterSchema = z.object({
  title: z.string().min(1, 'Поле title обязательно'),
  description: z.string().min(1, 'Поле description обязательно'),
  audience: z.array(audienceSchema).default([]),
  section: z.string().min(1, 'Поле section обязательно'),
  order: z.number().int().nonnegative().default(0),
  reading_minutes: z.number().int().positive().optional(),
  updated: z.string().optional(),
  related: z.array(z.string()).default([]),
  status: z.enum(['published', 'draft']).default('published'),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>

// ---- Типы публичного API ----

export interface DocPage {
  /** Полный slug — `<sectionSlug>/<articleSlug>`, например "03-network/wired" */
  slug: string
  /** Сегменты slug — для роутинга */
  slugSegments: string[]
  /** ID раздела — slug первой части, например "03-network" */
  sectionId: string
  /** Распарсенный frontmatter (восстановлен из колонок БД) */
  frontmatter: Frontmatter
  /** MDX-тело статьи (без frontmatter) */
  rawContent: string
  /** Минут чтения — из БД (Article.readingMinutes) */
  readingMinutes: number
  /** ID статьи в БД (нужен для revalidateTag в админке) */
  articleId: string
}

export interface SidebarNode {
  sectionId: string
  sectionTitle: string
  sectionOrder: number
  audience?: Audience[]
  pages: Array<{
    slug: string
    title: string
    order: number
    audience: Audience[]
    status: 'published' | 'draft'
  }>
}

// ---- Маппинг enum БД ↔ литералов фронта ----

const audienceFromDb: Record<AudienceEnum, Audience> = {
  [AudienceEnum.OPERATOR]: 'operator',
  [AudienceEnum.ADMIN_AUDIENCE]: 'admin',
  [AudienceEnum.DEVELOPER]: 'developer',
}

function statusFromDb(status: ArticleStatus): 'published' | 'draft' {
  return status === ArticleStatus.PUBLISHED ? 'published' : 'draft'
}

// ---- Чтение из БД ----

interface ArticleRow {
  id: string
  slug: string
  title: string
  description: string
  body: string
  audience: AudienceEnum[]
  order: number
  status: ArticleStatus
  readingMinutes: number
  related: string[]
  publishedAt: Date | null
  updatedAt: Date
  section: { slug: string; title: string; order: number }
}

function rowToDocPage(row: ArticleRow): DocPage {
  const sectionSlug = row.section.slug
  const fullSlug = `${sectionSlug}/${row.slug}`
  const audience = row.audience
    .map((a) => audienceFromDb[a])
    .filter((v): v is Audience => v !== undefined)

  const updatedDate = row.publishedAt ?? row.updatedAt
  const updatedString = updatedDate.toISOString().slice(0, 10)

  return {
    slug: fullSlug,
    slugSegments: fullSlug.split('/'),
    sectionId: sectionSlug,
    frontmatter: {
      title: row.title,
      description: row.description,
      audience,
      section: sectionSlug,
      order: row.order,
      reading_minutes: row.readingMinutes,
      updated: updatedString,
      related: row.related,
      status: statusFromDb(row.status),
    },
    rawContent: row.body,
    readingMinutes: row.readingMinutes,
    articleId: row.id,
  }
}

const getAllPagesUncached = async (): Promise<DocPage[]> => {
  const rows = await prisma.article.findMany({
    where: { deletedAt: null },
    include: { section: { select: { slug: true, title: true, order: true } } },
    orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }, { title: 'asc' }],
  })
  return rows.map(rowToDocPage)
}

const cachedGetAllPages = unstable_cache(getAllPagesUncached, ['content:all-pages'], {
  tags: ['sidebar'],
  revalidate: 3600,
})

const getPageUncached = async (sectionSlug: string, slug: string): Promise<DocPage | null> => {
  const row = await prisma.article.findFirst({
    where: { deletedAt: null, slug, section: { slug: sectionSlug } },
    include: { section: { select: { slug: true, title: true, order: true } } },
  })
  return row ? rowToDocPage(row) : null
}

// ---- Публичный API ----

/**
 * Загружает все страницы (без soft-deleted). Кешируется по тегу 'sidebar'.
 */
export async function getAllPages(): Promise<DocPage[]> {
  return cachedGetAllPages()
}

/**
 * Только опубликованные страницы.
 */
export async function getPublishedPages(): Promise<DocPage[]> {
  const pages = await getAllPages()
  return pages.filter((p) => p.frontmatter.status === 'published')
}

/**
 * Находит страницу по slug-сегментам ['<sectionSlug>', '<articleSlug>'] (или
 * объединённому slug). Возвращает null, если страница не найдена.
 */
export async function getPageBySlug(slugSegments: string[]): Promise<DocPage | null> {
  if (slugSegments.length < 2) return null
  const sectionSlug = slugSegments[0]!
  const slug = slugSegments.slice(1).join('/')
  if (!sectionSlug || !slug) return null

  // Кешируем каждую статью по индивидуальному ключу+тегу.
  const cached = unstable_cache(
    () => getPageUncached(sectionSlug, slug),
    [`content:article:${sectionSlug}/${slug}`],
    { tags: ['sidebar', `article:${sectionSlug}/${slug}`], revalidate: 3600 },
  )
  return cached()
}

/**
 * Возвращает дерево сайдбара: разделы + страницы внутри них.
 */
export async function getSidebar(): Promise<SidebarNode[]> {
  const pages = await getAllPages()
  const bySection = new Map<string, DocPage[]>()
  for (const page of pages) {
    const list = bySection.get(page.sectionId) ?? []
    list.push(page)
    bySection.set(page.sectionId, list)
  }

  const nodes: SidebarNode[] = []
  for (const section of SECTIONS) {
    const sectionPages = (bySection.get(section.id) ?? []).slice().sort((a, b) => {
      const orderDiff = a.frontmatter.order - b.frontmatter.order
      if (orderDiff !== 0) return orderDiff
      return a.frontmatter.title.localeCompare(b.frontmatter.title, 'ru')
    })

    const node: SidebarNode = {
      sectionId: section.id,
      sectionTitle: section.title,
      sectionOrder: section.order,
      pages: sectionPages.map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        order: p.frontmatter.order,
        audience: p.frontmatter.audience,
        status: p.frontmatter.status,
      })),
    }
    if (section.audience) {
      node.audience = [...section.audience]
    }
    nodes.push(node)
  }

  return nodes
}

/**
 * Возвращает предыдущую/следующую страницу для навигации.
 */
export async function getAdjacentPages(slug: string): Promise<{
  previous: DocPage | null
  next: DocPage | null
}> {
  const ordered = (await getAllPages()).filter((p) => p.frontmatter.status === 'published')
  const idx = ordered.findIndex((p) => p.slug === slug)
  if (idx === -1) {
    return { previous: null, next: null }
  }
  return {
    previous: idx > 0 ? (ordered[idx - 1] ?? null) : null,
    next: idx < ordered.length - 1 ? (ordered[idx + 1] ?? null) : null,
  }
}

/**
 * Хлебные крошки для страницы.
 */
export async function getBreadcrumbs(
  slug: string,
): Promise<Array<{ label: string; href: string }>> {
  const page = await getPageBySlug(slug.split('/'))
  if (!page) return []
  const section = SECTIONS.find((s) => s.id === page.sectionId)
  const crumbs: Array<{ label: string; href: string }> = [{ label: 'Главная', href: '/' }]
  if (section) {
    crumbs.push({ label: section.title, href: `/${section.id}` })
  }
  crumbs.push({ label: page.frontmatter.title, href: `/${page.slug}` })
  return crumbs
}

/**
 * Параметры для generateStaticParams (на проде не используется — ISR динамический,
 * но оставлено как утилита для будущего pre-render'а).
 */
export async function getAllPageParams(): Promise<Array<{ slug: string[] }>> {
  return (await getPublishedPages()).map((p) => ({ slug: p.slugSegments }))
}
