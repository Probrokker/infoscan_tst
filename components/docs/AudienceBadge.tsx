/**
 * Цветная пилюля «Для кого». Цвет + иконка + текст — не только цвет
 * (требование WCAG: цвет не единственный носитель информации).
 */
import { Wrench, Server, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUDIENCES, type Audience } from '@/lib/constants'

const ICONS = {
  operator: Wrench,
  admin: Server,
  developer: Code,
} as const

const COLORS = {
  operator: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  admin: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  developer: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
} as const

export function AudienceBadge({ audience, className }: { audience: Audience; className?: string }) {
  const config = AUDIENCES.find((a) => a.id === audience)
  if (!config) return null
  const Icon = ICONS[audience]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        COLORS[audience],
        className,
      )}
      aria-label={`Аудитория: ${config.label}`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.5} aria-hidden />
      {config.label}
    </span>
  )
}

export function AudienceBadgeList({ audiences }: { audiences: Audience[] }) {
  if (audiences.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {audiences.map((a) => (
        <AudienceBadge key={a} audience={a} />
      ))}
    </div>
  )
}
