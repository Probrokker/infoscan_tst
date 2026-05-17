/**
 * Публичный поиск по статьям. ILIKE по title + description (для MVP без tsvector).
 * GET /api/public/search?q=инфоскан → массив { slug, title, description, sectionTitle }.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma, ArticleStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { SECTIONS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q') ?? '',
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ results: [] }, { status: 200 })
  }

  const { q, limit } = parsed.data
  const articles = await prisma.article.findMany({
    where: {
      deletedAt: null,
      status: ArticleStatus.PUBLISHED,
      OR: [
        { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ],
    },
    include: { section: { select: { slug: true, title: true } } },
    orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }],
    take: limit,
  })

  return NextResponse.json({
    results: articles.map((a) => ({
      slug: `${a.section.slug}/${a.slug}`,
      title: a.title,
      description: a.description,
      sectionTitle: SECTIONS.find((s) => s.id === a.section.slug)?.title ?? a.section.title,
    })),
  })
}
