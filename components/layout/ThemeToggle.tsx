'use client'

/**
 * Переключатель темы. Цикл: system → light → dark → system.
 * Иконка меняется в зависимости от текущей resolvedTheme.
 */
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, MonitorCog } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // До монтирования рисуем плейсхолдер, чтобы не было FOUC и скачка темы.
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Переключатель темы" disabled>
        <Sun className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </Button>
    )
  }

  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'

  const Icon = theme === 'system' ? MonitorCog : resolvedTheme === 'dark' ? Moon : Sun
  const label =
    theme === 'system'
      ? 'Тема: системная. Переключить на светлую.'
      : theme === 'light'
        ? 'Тема: светлая. Переключить на тёмную.'
        : 'Тема: тёмная. Переключить на системную.'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
    </Button>
  )
}
