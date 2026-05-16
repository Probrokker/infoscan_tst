/**
 * Callout — врезка «Внимание / Совет / Ошибка / Заметка».
 * Используется внутри MDX. Цвет + иконка + текст (WCAG).
 */
import { Info, Lightbulb, AlertTriangle, AlertCircle, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type CalloutKind = 'note' | 'tip' | 'warning' | 'danger' | 'info'

const STYLES: Record<CalloutKind, { icon: typeof Info; classes: string; label: string }> = {
  note: {
    icon: FileText,
    classes:
      'border-zinc-300 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100',
    label: 'Заметка',
  },
  tip: {
    icon: Lightbulb,
    classes:
      'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
    label: 'Совет',
  },
  warning: {
    icon: AlertTriangle,
    classes:
      'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
    label: 'Внимание',
  },
  danger: {
    icon: AlertCircle,
    classes:
      'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100',
    label: 'Опасно',
  },
  info: {
    icon: Info,
    classes:
      'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100',
    label: 'Инфо',
  },
}

export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: CalloutKind
  title?: string
  children: ReactNode
}) {
  const config = STYLES[kind]
  const Icon = config.icon
  return (
    <aside
      role="note"
      className={cn('my-6 rounded-[var(--radius-card)] border-l-4 p-4', config.classes)}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-sm font-semibold">{title ?? config.label}</div>
          <div className="text-sm leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </aside>
  )
}
