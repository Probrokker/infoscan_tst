/**
 * Сборка статического индекса поиска. Используется build-time скриптом
 * scripts/build-search.ts → public/search-index.json.
 *
 * Здесь ходим в БД напрямую через Prisma, минуя unstable_cache из lib/content.ts:
 * unstable_cache работает только внутри runtime Next.js, а build-search.ts —
 * это standalone tsx-скрипт.
 */
import { ArticleStatus, type Audience as AudienceEnum, PrismaClient } from '@prisma/client'
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

const audienceFromDb: Record<AudienceEnum, string> = {
  OPERATOR: 'operator',
  ADMIN_AUDIENCE: 'admin',
  DEVELOPER: 'developer',
}

function stripMdx(content: string): string {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`#>|]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getSearchIndex(): Promise<SearchEntry[]> {
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.article.findMany({
      where: { deletedAt: null, status: ArticleStatus.PUBLISHED },
      include: { section: { select: { slug: true, title: true, order: true } } },
      orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }, { title: 'asc' }],
    })
    return rows.map((row) => {
      const fullSlug = `${row.section.slug}/${row.slug}`
      const audience = row.audience.map((a) => audienceFromDb[a]).filter((v): v is string => !!v)
      const sectionInfo = SECTIONS.find((s) => s.id === row.section.slug)
      return {
        slug: fullSlug,
        title: row.title,
        description: row.description,
        section: row.section.slug,
        sectionTitle: sectionInfo?.title ?? row.section.title,
        audience,
        body: stripMdx(row.body).slice(0, 1500),
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}
