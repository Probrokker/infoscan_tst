'use client'

/**
 * SortableList — обёртка над @dnd-kit для перетаскивания строк.
 *
 * Принимает массив items с полем id, render-функцию для каждой строки
 * и коллбэк onReorder(newOrder: string[]) — вызывается после drop.
 *
 * Пример:
 *   <SortableList
 *     items={sections}
 *     onReorder={async (ids) => reorderSectionsAction(ids)}
 *     renderItem={(item, { dragHandle }) => (
 *       <div className="flex items-center gap-2">
 *         {dragHandle}
 *         {item.title}
 *       </div>
 *     )}
 *   />
 */
import * as React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragHandle } from './DragHandle'
import { toast } from 'sonner'

interface SortableItem {
  id: string
}

interface RenderItemContext {
  dragHandle: React.ReactNode
  isDragging: boolean
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onReorder: (newIds: string[]) => Promise<void>
  renderItem: (item: T, ctx: RenderItemContext) => React.ReactNode
  className?: string
}

function SortableRow<T extends SortableItem>({
  item,
  renderItem,
}: {
  item: T
  renderItem: (item: T, ctx: RenderItemContext) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, {
        dragHandle: (
          <DragHandle
            listeners={listeners as Record<string, unknown>}
            attributes={attributes as unknown as Record<string, unknown>}
          />
        ),
        isDragging,
      })}
    </div>
  )
}

export function SortableList<T extends SortableItem>({
  items: initialItems,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const [items, setItems] = React.useState<T[]>(initialItems)

  React.useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id)
      const newIndex = prev.findIndex((i) => i.id === over.id)
      const next = arrayMove(prev, oldIndex, newIndex)
      onReorder(next.map((i) => i.id)).catch((e: unknown) => {
        console.error('[sortable] reorder failed', e)
        toast.error('Не удалось сохранить порядок')
        setItems(prev)
      })
      return next
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableRow key={item.id} item={item} renderItem={renderItem} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
