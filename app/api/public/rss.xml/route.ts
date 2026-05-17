/**
 * RSS-фид опубликованных статей. Генерируется по запросу с ISR-кешем.
 */
import { getPublishedPages } from '@/lib/content'
import { env, getServerEnv } from '@/lib/env'
import { SITE } from '@/lib/constants'

// Не предрендеривать при сборке — нужна живая БД
export const dynamic = 'force-dynamic'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  // getServerEnv валидирует, что мы на сервере; здесь нам нужен только NEXT_PUBLIC_SITE_URL.
  void getServerEnv
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const pages = await getPublishedPages()

  const items = pages
    .slice()
    .sort((a, b) => {
      const aDate = a.frontmatter.updated ? Date.parse(a.frontmatter.updated) : 0
      const bDate = b.frontmatter.updated ? Date.parse(b.frontmatter.updated) : 0
      return bDate - aDate
    })
    .slice(0, 50)
    .map((page) => {
      const url = `${baseUrl}/${page.slug}`
      const pubDate = page.frontmatter.updated
        ? new Date(page.frontmatter.updated).toUTCString()
        : new Date().toUTCString()
      return [
        '    <item>',
        `      <title>${escapeXml(page.frontmatter.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(page.frontmatter.description)}</description>`,
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>${SITE.htmlLang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
