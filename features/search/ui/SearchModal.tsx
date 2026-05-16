'use client'

/**
 * Модалка поиска Cmd+K. Индекс грузится лениво при первом открытии.
 * Поиск через Fuse.js — мгновенный по ~50 статьям. Когда количество вырастет
 * до сотен — переключимся на Pagefind (статика уже подключена в зависимостях).
 */
import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Fuse from 'fuse.js'
import Link from 'next/link'
import { Search, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchEntry } from '@/features/search/lib/index-data'

export function SearchModal() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [entries, setEntries] = React.useState<SearchEntry[]>([])
  const [loadingIndex, setLoadingIndex] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Cmd+K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Фокус в поле поиска при открытии (без HTML autoFocus — дружелюбнее к a11y-линтеру).
  React.useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  // Ленивая загрузка индекса при первом открытии
  React.useEffect(() => {
    if (!open || entries.length > 0 || loadingIndex) return
    setLoadingIndex(true)
    fetch('/search-index.json')
      .then((r) => r.json() as Promise<SearchEntry[]>)
      .then((data) => setEntries(data))
      .catch((e) => console.error('Не удалось загрузить поисковый индекс:', e))
      .finally(() => setLoadingIndex(false))
  }, [open, entries.length, loadingIndex])

  const fuse = React.useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'description', weight: 0.3 },
          { name: 'body', weight: 0.2 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [entries],
  )

  const results = React.useMemo(() => {
    if (!query.trim()) return entries.slice(0, 8)
    return fuse.search(query, { limit: 12 }).map((r) => r.item)
  }, [query, fuse, entries])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-btn)] border bg-transparent px-3 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Поиск по документации (Ctrl+K)"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          <span className="hidden sm:inline">Поиск</span>
          <kbd className="hidden rounded border bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs sm:inline">
            Ctrl K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed top-[20%] left-1/2 z-50 -translate-x-1/2',
            'w-full max-w-xl rounded-[var(--radius-modal)] border bg-[var(--popover)] shadow-2xl',
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Поиск по документации</Dialog.Title>

          <div className="flex items-center border-b px-4">
            <Search
              className="h-4 w-4 text-[var(--muted-foreground)]"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по статьям…"
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <Dialog.Close asChild>
              <button
                aria-label="Закрыть"
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loadingIndex && (
              <div className="px-3 py-4 text-sm text-[var(--muted-foreground)]">
                Загрузка индекса…
              </div>
            )}
            {!loadingIndex && results.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
                {query.trim() ? `Ничего не нашлось по «${query}»` : 'Введите запрос'}
              </div>
            )}
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-[var(--radius-btn)] p-3 transition-colors hover:bg-[var(--accent)]"
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {r.sectionTitle}
                        </div>
                        <div className="font-medium">{r.title}</div>
                        <div className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                          {r.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
