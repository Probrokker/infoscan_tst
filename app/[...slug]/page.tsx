/**
 * Универсальный рендер любой MDX-статьи по слагу.
 * Использует next-mdx-remote с компиляцией на сервере: парсим frontmatter и контент,
 * компилируем MDX, отдаём через MDXRemote.
 *
 * Поведение:
 * - generateStaticParams перечисляет все published-статьи → пути предсобираются.
 * - generateMetadata строит title/description/OG из frontmatter.
 * - Сама страница — обёртка с Header/Sidebar/Article/PageNav, плюс прокидывает
 *   кастомные компоненты (Callout, Steps, CodeTabs, Mermaid).
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { compileMDX } from 'next-mdx-remote/rsc'
import { ArrowRight, BookOpen } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import { remarkMermaid } from '@theguild/remark-mermaid'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import { Sidebar } from '@/components/layout/Sidebar'
import { Breadcrumbs } from '@/components/docs/Breadcrumbs'
import { PageHeader } from '@/components/docs/PageHeader'
import { PageNav } from '@/components/docs/PageNav'
import { AudienceBadgeList } from '@/components/docs/AudienceBadge'
import { Callout } from '@/components/docs/Callout'
import { Steps, Step } from '@/components/docs/Steps'
import { CodeTabs } from '@/components/docs/CodeTabs'
import { Mermaid } from '@/components/docs/Mermaid'
import { MdxPre } from '@/components/docs/MdxPre'
import { MdxTable } from '@/components/docs/MdxTable'
import {
  getAllPageParams,
  getAdjacentPages,
  getBreadcrumbs,
  getPageBySlug,
  getSidebar,
} from '@/lib/content'
import { env } from '@/lib/env'
import { SITE, SECTIONS } from '@/lib/constants'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export function generateStaticParams(): Array<{ slug: string[] }> {
  // К путям статей добавляем индексы разделов (slug = [sectionId]).
  return [...getAllPageParams(), ...SECTIONS.map((s) => ({ slug: [s.id] }))]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Случай: запрос к индексу раздела (slug = [sectionId])
  if (slug.length === 1) {
    const section = SECTIONS.find((s) => s.id === slug[0])
    if (section) {
      return {
        title: section.title,
        description: `${section.order}. ${section.title} — статьи и материалы в базе знаний Инфоскан.`,
      }
    }
  }

  const page = getPageBySlug(slug)
  if (!page) return {}
  const url = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/${page.slug}`
  return {
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: page.frontmatter.title,
      description: page.frontmatter.description,
      url,
      siteName: SITE.name,
      locale: SITE.defaultLocale,
      modifiedTime: page.frontmatter.updated,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.frontmatter.title,
      description: page.frontmatter.description,
    },
    robots: page.frontmatter.status === 'draft' ? { index: false, follow: true } : undefined,
  }
}

// ---- Индекс раздела ----

function SectionIndex({ sectionId }: { sectionId: string }) {
  const section = SECTIONS.find((s) => s.id === sectionId)
  if (!section) return null
  const tree = getSidebar()
  const node = tree.find((n) => n.sectionId === sectionId)
  const pages = node?.pages.filter((p) => p.status === 'published') ?? []

  return (
    <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 sm:px-6 lg:px-8">
      <Sidebar tree={tree} activeSlug={sectionId} className="hidden lg:block" />
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

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params

  // 1) slug длиной 1 и совпадает с sectionId — это индекс раздела.
  if (slug.length === 1) {
    const section = SECTIONS.find((s) => s.id === slug[0])
    if (section) {
      return <SectionIndex sectionId={section.id} />
    }
  }

  const page = getPageBySlug(slug)
  if (!page) {
    notFound()
  }

  const { content } = await compileMDX({
    source: page.rawContent,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, [remarkMermaid, { theme: 'neutral' }]],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['anchor-link'],
                ariaLabel: 'Постоянная ссылка на раздел',
              },
            },
          ],
          [
            rehypePrettyCode,
            {
              theme: { light: 'github-light', dark: 'github-dark' },
              keepBackground: true,
              defaultLanguage: 'text',
            },
          ],
        ],
      },
    },
    components: {
      Callout,
      Steps,
      Step,
      CodeTabs,
      Mermaid,
      pre: MdxPre,
      table: MdxTable,
    },
  })

  const tree = getSidebar()
  const crumbs = getBreadcrumbs(page.slug)
  const { previous, next } = getAdjacentPages(page.slug)

  return (
    <div className="mx-auto flex max-w-screen-2xl gap-8 px-4 sm:px-6 lg:px-8">
      <Sidebar tree={tree} activeSlug={page.slug} className="hidden lg:block" />

      <article className="min-w-0 flex-1 py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={crumbs} />
          <PageHeader frontmatter={page.frontmatter} readingMinutes={page.readingMinutes} />

          <div
            className={[
              'prose prose-zinc dark:prose-invert max-w-none',
              'prose-headings:scroll-mt-20 prose-headings:font-semibold',
              'prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[var(--border)] prose-h2:pb-2',
              'prose-h3:mt-8 prose-h3:mb-3',
              'prose-p:leading-relaxed prose-li:my-1',
              'prose-strong:font-semibold',
            ].join(' ')}
          >
            {content}
          </div>

          <PageNav previous={previous} next={next} />
        </div>
      </article>
    </div>
  )
}
