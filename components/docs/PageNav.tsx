/**
 * Нижняя навигация: «← Предыдущее», «Следующее →» (как у docusaurus).
 */
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { DocPage } from '@/lib/content'

export function PageNav({ previous, next }: { previous: DocPage | null; next: DocPage | null }) {
  if (!previous && !next) return null

  return (
    <nav
      aria-label="Навигация по статьям"
      className="mt-12 grid gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={`/${previous.slug}`}
          className="group flex flex-col items-start rounded-[var(--radius-card)] border p-4 transition-colors hover:bg-[var(--accent)]"
        >
          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <ArrowLeft className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Предыдущее
          </span>
          <span className="mt-1 font-medium">{previous.frontmatter.title}</span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/${next.slug}`}
          className="group flex flex-col items-end rounded-[var(--radius-card)] border p-4 text-right transition-colors hover:bg-[var(--accent)]"
        >
          <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            Следующее
            <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="mt-1 font-medium">{next.frontmatter.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
