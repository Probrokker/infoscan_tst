/**
 * Страница статьи: /<section-slug>/<article-slug>/.
 * Контент берётся из БД, MDX компилируется через next-mdx-remote/rsc.
 *
 * ISR: revalidate 3600s. После правки админ зовёт revalidateTag('article:<...>').
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import { Sidebar } from '@/components/layout/Sidebar'
import { Breadcrumbs } from '@/components/docs/Breadcrumbs'
import { PageHeader } from '@/components/docs/PageHeader'
import { PageNav } from '@/components/docs/PageNav'
import { Callout } from '@/components/docs/Callout'
import { Steps, Step } from '@/components/docs/Steps'
import { CodeTabs } from '@/components/docs/CodeTabs'
import { Mermaid } from '@/components/docs/Mermaid'
import { MdxPre } from '@/components/docs/MdxPre'
import { MdxTable } from '@/components/docs/MdxTable'
import { getAdjacentPages, getBreadcrumbs, getPageBySlug, getSidebar } from '@/lib/content'
import { env } from '@/lib/env'
import { SITE } from '@/lib/constants'

export const revalidate = 3600
export const dynamicParams = true

interface PageProps {
  params: Promise<{ section: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params
  const page = await getPageBySlug([section, slug])
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

export default async function ArticlePage({ params }: PageProps) {
  const { section, slug } = await params
  const page = await getPageBySlug([section, slug])
  if (!page) {
    notFound()
  }

  const { content } = await compileMDX({
    source: page.rawContent,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
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

  const tree = await getSidebar()
  const crumbs = await getBreadcrumbs(page.slug)
  const { previous, next } = await getAdjacentPages(page.slug)

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
