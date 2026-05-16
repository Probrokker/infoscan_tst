/**
 * Сборка статического индекса поиска на этапе билда.
 * Используется fallback на Fuse.js — Pagefind в этом сетапе тоже подключается,
 * но Fuse даёт мгновенный ответ из памяти без сетевого запроса.
 *
 * Скрипт scripts/build-search.ts вызывает getSearchIndex() и складывает
 * результат в public/search-index.json.
 */
import { getPublishedPages } from '@/lib/content'
import { SECTIONS } from '@/lib/constants'

export interface SearchEntry {
  slug: string
  title: string
  description: string
  section: string
  sectionTitle: string
  audience: string[]
  /** Чистый текст без MDX-разметки — для полнотекстового поиска. */
  body: string
}

function stripMdx(content: string): string {
  return (
    content
      // Убираем JSX-теги
      .replace(/<[^>]+>/g, ' ')
      // Убираем код-блоки
      .replace(/```[\s\S]*?```/g, ' ')
      // Markdown-форматирование
      .replace(/[*_`#>|]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

export function getSearchIndex(): SearchEntry[] {
  return getPublishedPages().map((page) => {
    const section = SECTIONS.find((s) => s.id === page.sectionId)
    return {
      slug: page.slug,
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      section: page.sectionId,
      sectionTitle: section?.title ?? page.sectionId,
      audience: page.frontmatter.audience,
      body: stripMdx(page.rawContent).slice(0, 1500),
    }
  })
}
