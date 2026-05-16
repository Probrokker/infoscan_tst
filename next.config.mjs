// next.config.mjs — конфигурация Next.js 15 + MDX + standalone-сборка под Node.
// Документация: https://nextjs.org/docs/app/api-reference/next-config-js
//
// Архитектурный поворот: переход с output: 'export' (статика на nginx) на
// output: 'standalone' — Next запускается как Node-сервер, nginx становится
// reverse proxy. Это нужно для админки и SSR-страниц, которые читают из БД.

import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import { remarkMermaid } from '@theguild/remark-mermaid'
import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
})

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      remarkGfm,
      // Mermaid рендерится в SVG на этапе компиляции — без runtime-eval в браузере.
      [remarkMermaid, { theme: 'neutral' }],
    ],
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
        },
      ],
    ],
  },
})

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-сборка: Next генерирует server.js и минимальный набор зависимостей,
  // образ запускается через `node server.js` (см. Dockerfile).
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // trailingSlash отключён, чтобы /api/* не редиректили со 308.
  // Next по умолчанию делает /foo/ → /foo (308) — старые URL со слешем
  // продолжат работать, просто редиректятся на canonical без слеша.
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    // На VPS пока без CDN — sharp оптимизирует картинки runtime'ом.
    formats: ['image/webp', 'image/avif'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Жёстче дерево импортов для tree-shaking иконок.
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withBundleAnalyzer(withMDX(nextConfig))
