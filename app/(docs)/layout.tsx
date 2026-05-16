/**
 * Layout для всех статей документации. Оборачивает MDX-контент в article
 * с prose-классами (Tailwind Typography), добавляет контейнер с правильной
 * шириной и отступами.
 */
import type { ReactNode } from 'react'

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:rounded-[var(--radius-card)] prose-pre:border prose-code:font-mono">
        {children}
      </article>
    </div>
  )
}
