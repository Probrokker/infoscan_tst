/**
 * Автогенерация sitemap.xml на этапе билда.
 * Поднимает все published-страницы из content/ и статичные роуты.
 */
import type { MetadataRoute } from 'next'
import { getPublishedPages } from '@/lib/content'
import { env } from '@/lib/env'

/** Статический экспорт: sitemap собирается на этапе билда. */
export const dynamic = 'force-static'

const STATIC_ROUTES = [
  '',
  'integration/builder',
  'emulator',
  'learning-paths/operator',
  'learning-paths/admin',
  'learning-paths/developer',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  const pageEntries: MetadataRoute.Sitemap = getPublishedPages().map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.frontmatter.updated ? new Date(page.frontmatter.updated) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...pageEntries]
}
