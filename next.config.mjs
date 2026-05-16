// next.config.mjs — конфигурация Next.js 15 + MDX + статический экспорт.
// Документация: https://nextjs.org/docs/app/api-reference/next-config-js

import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkMermaid from '@theguild/remark-mermaid'
import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env['ANALYZE'] === 'true',
})

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      remarkGfm,
      // Mermaid-диаграммы рендерятся в SVG на этапе компиляции — без runtime-eval в браузере.
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
          keepBackground: false,
        },
      ],
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Полный статический экспорт — собранный сайт раздаётся nginx из папки out/.
  // Все CSP/HSTS-заголовки задаются на стороне nginx (см. nginx.conf).
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  // MDX-страницы рендерятся через [...slug]/page.tsx, но расширение оставляем,
  // чтобы рутовые .mdx (если появятся) тоже подхватывались.
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    // next/image при output: 'export' работает только в unoptimized-режиме.
    // Картинки оптимизируются на этапе билда отдельным скриптом (scripts/optimize-images.ts).
    unoptimized: true,
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
}

export default withBundleAnalyzer(withMDX(nextConfig))
