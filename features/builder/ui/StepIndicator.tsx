'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEP_TITLES = [
  'Тип шаблона',
  'Целевая система',
  'Транспорт',
  'Поля и тело',
  'Аутентификация',
  'Обработка ответа',
] as const

export function StepIndicator({
  current,
  onJump,
}: {
  current: number
  onJump?: (step: number) => void
}) {
  return (
    <ol
      className="flex flex-wrap items-center gap-2 text-sm"
      aria-label="Шаги конструктора"
    >
      {STEP_TITLES.map((title, i) => {
        const step = i + 1
        const isCurrent = step === current
        const isPassed = step < current
        const interactive = onJump && step <= current
        const Tag = interactive ? 'button' : 'div'
        return (
          <li key={step} className="flex items-center gap-2">
            <Tag
              {...(interactive ? { onClick: () => onJump(step), type: 'button' } : {})}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors',
                isCurrent && 'bg-[var(--color-yellow-brand)] text-[var(--color-black-brand)]',
                isPassed && 'bg-[var(--accent)] text-[var(--foreground)]',
                !isCurrent && !isPassed && 'text-[var(--muted-foreground)]',
                interactive && 'cursor-pointer hover:opacity-90',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                  isCurrent && 'bg-[var(--color-black-brand)] text-[var(--color-yellow-brand)]',
                  isPassed && 'bg-[var(--color-yellow-brand)] text-[var(--color-black-brand)]',
                  !isCurrent && !isPassed && 'border border-[var(--border)]',
                )}
                aria-hidden
              >
                {isPassed ? <Check className="h-3 w-3" strokeWidth={2} /> : step}
              </span>
              <span className="hidden sm:inline">{title}</span>
            </Tag>
            {step < STEP_TITLES.length && (
              <span aria-hidden className="h-px w-4 bg-[var(--border)]" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
