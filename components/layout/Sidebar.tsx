/**
 * Левый сайдбар: двухуровневое дерево разделов и статей.
 * Жирным — разделы первого уровня. Бейджи аудитории — справа от названия статьи.
 */
import Link from 'next/link'
import { AudienceBadgeList } from '@/components/docs/AudienceBadge'
import type { SidebarNode } from '@/lib/content'
import { cn } from '@/lib/utils'

export function Sidebar({
  tree,
  activeSlug,
  className,
}: {
  tree: SidebarNode[]
  activeSlug?: string
  className?: string
}) {
  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] w-[280px] shrink-0 overflow-y-auto border-r bg-[var(--background)] py-6 pr-4',
        className,
      )}
      aria-label="Навигация по разделам"
    >
      <nav>
        {tree.map((section) => (
          <div key={section.sectionId} className="mb-6">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              <Link
                href={`/${section.sectionId}`}
                className="font-bold hover:text-[var(--foreground)]"
              >
                {section.sectionOrder}. {section.sectionTitle}
              </Link>
            </h2>
            {section.pages.length === 0 ? (
              <p className="px-2 text-xs text-[var(--muted-foreground)] italic">
                В этом разделе пока нет статей.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {section.pages
                  .filter((p) => p.status === 'published')
                  .map((page) => {
                    const isActive = activeSlug === page.slug
                    return (
                      <li key={page.slug}>
                        <Link
                          href={`/${page.slug}`}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'group flex items-center justify-between gap-2 rounded-[var(--radius-btn)] px-2 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-[var(--accent)] font-medium text-[var(--foreground)]'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
                          )}
                        >
                          <span className="truncate">{page.title}</span>
                          {page.audience.length > 0 && (
                            <AudienceBadgeList audiences={page.audience} />
                          )}
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
