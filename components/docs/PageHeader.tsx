/**
 * Шапка статьи: H1, описание, бейджи аудитории, метаинформация (время, дата).
 */
import { Clock, Calendar } from 'lucide-react'
import { AudienceBadgeList } from '@/components/docs/AudienceBadge'
import { DraftBanner } from '@/components/docs/DraftBanner'
import { formatDate, pluralize } from '@/lib/utils'
import type { Frontmatter } from '@/lib/content'

export function PageHeader({
  frontmatter,
  readingMinutes,
}: {
  frontmatter: Frontmatter
  readingMinutes: number
}) {
  const minWord = pluralize(readingMinutes, ['минута', 'минуты', 'минут'])
  return (
    <header className="mb-8 border-b border-[var(--border)] pb-8">
      {frontmatter.status === 'draft' && <DraftBanner />}

      <AudienceBadgeList audiences={frontmatter.audience} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{frontmatter.title}</h1>

      <p className="mt-3 text-lg text-[var(--muted-foreground)]">{frontmatter.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {readingMinutes} {minWord} чтения
        </span>
        {frontmatter.updated && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Обновлено {formatDate(frontmatter.updated)}
          </span>
        )}
      </div>
    </header>
  )
}
