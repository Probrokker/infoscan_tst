/**
 * Индексная страница раздела документации: /<section-slug>/.
 * Показывает список опубликованных статей раздела.
 *
 * ISR: revalidate 3600s. После публикации/правки админ зовёт revalidateTag('sidebar')
 * — кеш этой страницы инвалидируется.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AudienceBadgeList } from '@/components/docs/AudienceBadge'
import { getSidebar } from '@/lib/content'
import { SECTIONS } from '@/lib/constants'

export const revalidate = 3600
export const dynamicParams = true

interface PageProps {
  params: Promise<{ section: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params
  const section = SECTIONS.find((s) => s.id === sectionSlug)
  if (!section) return {}
  return {
    title: section.title,
    description: `${section.order}. ${section.title} — статьи и материалы в базе знаний Инфоскан.`,
  }
}

export default async function SectionIndexPage({ params }: PageProps) {
  const { section: sectionSlug } = await params
  const section = SECTIONS.find((s) => s.id === sectionSlug)
  if (!section) {
    notFound()
  }

  const tree = await getSidebar()
  const node = tree.find((n) => n.sectionId === sectionSlug)
  const pages = node?.pages.filter((p) => p.status === 'published') ?? []

  return (
    <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 sm:px-6 lg:px-8">
      <Sidebar tree={tree} activeSlug={sectionSlug} className="hidden lg:block" />
      <div className="min-w-0 flex-1 py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Раздел {section.order}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{section.title}</h1>
          </header>

          {pages.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border bg-[var(--muted)] p-8 text-center text-[var(--muted-foreground)]">
              В этом разделе пока нет статей.
            </div>
          ) : (
            <ol className="space-y-3">
              {pages.map((page) => (
                <li
                  key={page.slug}
                  className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]"
                >
                  <Link href={`/${page.slug}`} className="group block p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="font-medium">{page.title}</h2>
                        {page.audience.length > 0 && (
                          <div className="mt-2">
                            <AudienceBadgeList audiences={page.audience} />
                          </div>
                        )}
                      </div>
                      <ArrowRight
                        className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
