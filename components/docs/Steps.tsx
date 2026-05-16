/**
 * Steps — пронумерованный список шагов «гайда».
 * Каждый <Step> — карточка с номером, заголовком, текстом.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Steps({ children, className }: { children: React.ReactNode; className?: string }) {
  const items = React.Children.toArray(children).filter(React.isValidElement)
  return (
    <ol className={cn('my-6 space-y-6', className)}>
      {items.map((child, i) =>
        React.cloneElement(child as React.ReactElement<{ index?: number }>, {
          index: i + 1,
          key: i,
        }),
      )}
    </ol>
  )
}

export function Step({
  title,
  children,
  index,
}: {
  title: string
  children: React.ReactNode
  index?: number
}) {
  return (
    <li className="flex gap-4">
      <div
        aria-hidden
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-yellow-brand)] font-mono text-sm font-semibold text-[var(--color-black-brand)]"
      >
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm leading-relaxed text-[var(--foreground)] [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </li>
  )
}
