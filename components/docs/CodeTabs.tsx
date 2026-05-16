'use client'

/**
 * CodeTabs — табы для примеров на разных языках (cURL, JS, PHP, 1С).
 * Запоминает выбранный язык в localStorage, чтобы все примеры на странице
 * показывались в одном предпочтительном языке.
 */
import * as React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'infoscan-docs:preferred-code-tab'

export interface CodeTab {
  label: string
  /** Готовый блок с подсветкой (обычно <pre><code class="language-..." />). */
  content: React.ReactNode
}

export function CodeTabs({ tabs, className }: { tabs: CodeTab[]; className?: string }) {
  const firstLabel = tabs[0]?.label ?? ''
  const [value, setValue] = React.useState<string>(firstLabel)

  // Восстанавливаем выбор из localStorage, если такой таб есть в текущем наборе.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored && tabs.some((t) => t.label === stored)) {
        setValue(stored)
      }
    } catch {
      // SSR / privacy mode — игнорируем.
    }
  }, [tabs])

  const onChange = React.useCallback((next: string) => {
    setValue(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  if (tabs.length === 0) return null

  return (
    <Tabs.Root value={value} onValueChange={onChange} className={cn('my-6', className)}>
      <Tabs.List
        className="flex flex-wrap items-center gap-1 border-b border-[var(--border)]"
        aria-label="Примеры на разных языках"
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.label}
            value={t.label}
            className={cn(
              'rounded-t-[var(--radius-btn)] px-3 py-2 text-sm font-medium transition-colors',
              'data-[state=inactive]:text-[var(--muted-foreground)]',
              'data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)]',
              'hover:text-[var(--foreground)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t) => (
        <Tabs.Content
          key={t.label}
          value={t.label}
          className="mt-0 rounded-b-[var(--radius-card)] bg-[var(--muted)] p-4"
        >
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
