/**
 * Работа с контентом: парсинг MDX, frontmatter, оглавления, дерева сайдбара.
 * Используется только на сервере (Node API: fs, path) — никакого браузерного импорта.
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { z } from 'zod'
import { SECTIONS, type Audience } from '@/lib/constants'

// ---- Zod-схема frontmatter ----

const audienceSchema = z.enum(['operator', 'admin', 'developer'])

export const frontmatterSchema = z.object({
  title: z.string().min(1, 'Поле title обязательно'),
  description: z.string().min(1, 'Поле description обязательно'),
  audience: z.array(audienceSchema).default([]),
  section: z.string().min(1, 'Поле section обязательно'),
  order: z.number().int().nonnegative().default(0),
  reading_minutes: z.number().int().positive().optional(),
  updated: z.preprocess(
    (val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val),
    z.string().optional(),
  ),
  related: z.array(z.string()).default([]),
  status: z.enum(['published', 'draft']).default('published'),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>

// ---- Типы ----

export interface DocPage {
  /** Полный slug — путь от content/ без расширения, например "03-network/04-personal-cabinet" */
  slug: string
  /** Сегменты slug — для роутинга */
  slugSegments: string[]
  /** ID раздела — первая часть slug */
  sectionId: string
  /** Распарсенный frontmatter */
  frontmatter: Frontmatter
  /** Сырой контент без frontmatter */
  rawContent: string
  /** Минут чтения (если в frontmatter не задано — посчитано по тексту) */
  readingMinutes: number
  /** Абсолютный путь к MDX-файлу */
  filePath: string
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

// ---- Константы ----

const CONTENT_DIR = path.join(process.cwd(), 'content')

// ---- Кеш для билд-времени ----

let cachedPages: DocPage[] | null = null

// ---- Внутренние утилиты ----

function findMdxFiles(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      findMdxFiles(full, results)
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

function fileToSlug(filePath: string): { slug: string; slugSegments: string[]; sectionId: string } {
  const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/')
  const withoutExt = relative.replace(/\.mdx?$/, '')
  const segments = withoutExt.split('/').filter(Boolean)
  const sectionId = segments[0] ?? ''
  return { slug: withoutExt, slugSegments: segments, sectionId }
}

// ---- Публичный API ----

/**
 * Загружает все MDX-страницы. Кешируется на уровне процесса.
 */
export function getAllPages(): DocPage[] {
  if (cachedPages) return cachedPages

  const files = findMdxFiles(CONTENT_DIR)
  const pages: DocPage[] = []

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)

    const parsed = frontmatterSchema.safeParse(data)
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const msg = Object.entries(errors)
        .map(([k, v]) => `${k}: ${v?.join(', ')}`)
        .join('; ')
      throw new Error(`Невалидный frontmatter в ${filePath}: ${msg}`)
    }

    const { slug, slugSegments, sectionId } = fileToSlug(filePath)
    const fm = parsed.data
    const rt = readingTime(content)
    const readingMinutes = fm.reading_minutes ?? Math.max(1, Math.round(rt.minutes))

    pages.push({
      slug,
      slugSegments,
      sectionId,
      frontmatter: fm,
      rawContent: content,
      readingMinutes,
      filePath,
    })
  }

  cachedPages = pages
  return pages
}

/**
 * Находит страницу по slug-сегментам. Возвращает null, если страница не найдена.
 */
export function getPageBySlug(slugSegments: string[]): DocPage | null {
  const target = slugSegments.join('/')
  return getAllPages().find((p) => p.slug === target) ?? null
}

/**
 * Возвращает все опубликованные страницы (без draft) в раздел/слаг.
 */
export function getPublishedPages(): DocPage[] {
  return getAllPages().filter((p) => p.frontmatter.status === 'published')
}

/**
 * Возвращает дерево сайдбара: разделы + страницы внутри них.
 * Сортировка — по order, при равенстве — по title.
 */
export function getSidebar(): SidebarNode[] {
  const pages = getAllPages()
  const bySection = new Map<string, DocPage[]>()
  for (const page of pages) {
    const list = bySection.get(page.sectionId) ?? []
    list.push(page)
    bySection.set(page.sectionId, list)
  }

  const nodes: SidebarNode[] = []
  for (const section of SECTIONS) {
    const sectionPages = bySection.get(section.id) ?? []
    sectionPages.sort((a, b) => {
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
 * Сначала ищем в пределах раздела, потом — в соседних.
 */
export function getAdjacentPages(slug: string): {
  previous: DocPage | null
  next: DocPage | null
} {
  const ordered = getAllPages()
    .slice()
    .sort((a, b) => {
      const sectionA = SECTIONS.find((s) => s.id === a.sectionId)?.order ?? 999
      const sectionB = SECTIONS.find((s) => s.id === b.sectionId)?.order ?? 999
      if (sectionA !== sectionB) return sectionA - sectionB
      return a.frontmatter.order - b.frontmatter.order
    })
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
export function getBreadcrumbs(slug: string): Array<{ label: string; href: string }> {
  const page = getPageBySlug(slug.split('/'))
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
 * Параметры для generateStaticParams в App Router.
 */
export function getAllPageParams(): Array<{ slug: string[] }> {
  return getPublishedPages().map((p) => ({ slug: p.slugSegments }))
}
