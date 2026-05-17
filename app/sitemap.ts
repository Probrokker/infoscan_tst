/**
 * sitemap.xml — собирается на сервере по запросу с ISR-кешем.
 * Источник правды — БД (через getPublishedPages).
 */
import type { MetadataRoute } from 'next'
import { getPublishedPages } from '@/lib/content'
import { env } from '@/lib/env'

export const revalidate = 3600

const STATIC_ROUTES = [
  '',
  'integration/builder',
  'emulator',
  'learning-paths/operator',
  'learning-paths/admin',
  'learning-paths/developer',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  const pages = await getPublishedPages()
  const pageEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.frontmatter.updated ? new Date(page.frontmatter.updated) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...pageEntries]
}
