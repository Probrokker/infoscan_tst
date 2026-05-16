/**
 * Шапка сайта: логотип, три якоря «Для оператора/админа/разработчика»,
 * триггер поиска (Cmd+K), переключатель темы.
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { SITE, AUDIENCES } from '@/lib/constants'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/75">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={`/learning-paths/${a.id}`}
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={SITE.name}
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--color-yellow-brand)] text-[var(--color-black-brand)]"
          >
            И
          </span>
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>

        <nav
          className="ml-4 hidden items-center gap-1 lg:flex"
          aria-label="Учебные дорожки по ролям"
        >
          {AUDIENCES.map((a) => (
            <Button key={a.id} asChild variant="ghost" size="sm">
              <Link href={`/learning-paths/${a.id}`}>Для {a.label.toLowerCase()}а</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
