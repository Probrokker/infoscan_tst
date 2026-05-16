import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
