// Типы для импорта .mdx-файлов в TypeScript.
declare module '*.mdx' {
  import type { ComponentType, ReactNode } from 'react'

  export interface MDXFrontmatter {
    title: string
    description: string
    audience?: Array<'operator' | 'admin' | 'developer'>
    section?: string
    order?: number
    reading_minutes?: number
    updated?: string
    related?: string[]
    status?: 'published' | 'draft'
  }

  export const frontmatter: MDXFrontmatter
  const MDXComponent: ComponentType<{ children?: ReactNode }>
  export default MDXComponent
}
