'use client'

/**
 * DragHandle — иконка-рукоятка для drag-and-drop строки.
 * Используется внутри SortableList.
 */
import { GripVertical } from 'lucide-react'

export function DragHandle({
  listeners,
  attributes,
}: {
  listeners?: Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: Record<string, any>
}) {
  return (
    <button
      type="button"
      {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
      {...(attributes as React.HTMLAttributes<HTMLButtonElement>)}
      aria-label="Перетащить для изменения порядка"
      className="cursor-grab touch-none rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" strokeWidth={1.5} aria-hidden />
    </button>
  )
}
