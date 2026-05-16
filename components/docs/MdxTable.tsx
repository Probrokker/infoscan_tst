import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * GFM-таблицы внутри `.prose` иногда визуально «ломаются» без обёртки с overflow.
 * Оборачиваем <table> в scroll-container и задаём явные границы ячеек.
 */
export function MdxTable({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="not-prose docs-table-scroll my-6 w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <table
        className={cn('m-0 w-full min-w-[36rem] border-collapse text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}
