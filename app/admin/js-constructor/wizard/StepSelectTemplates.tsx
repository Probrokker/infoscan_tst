'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Plus, X, GripVertical, AlertTriangle, Tag } from 'lucide-react'
import type { JsTemplateData } from '@/lib/js-constructor-types'

interface Props {
  allTemplates: JsTemplateData[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function StepSelectTemplates({ allTemplates, selectedIds, onChange }: Props) {
  const [search, setSearch] = React.useState('')
  const [dragOver, setDragOver] = React.useState<number | null>(null)
  const dragItem = React.useRef<number | null>(null)

  const active = allTemplates.filter((t) => t.isActive)
  const filtered = active.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  )

  const categories = Array.from(new Set(filtered.map((t) => t.category))).sort()

  const selectedTemplates = selectedIds
    .map((id) => allTemplates.find((t) => t.id === id))
    .filter(Boolean) as JsTemplateData[]

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function remove(id: string) {
    onChange(selectedIds.filter((s) => s !== id))
  }

  // Drag-and-drop для порядка выбранных шаблонов
  function onDragStart(idx: number) {
    dragItem.current = idx
  }

  function onDragEnter(idx: number) {
    setDragOver(idx)
  }

  function onDragEnd() {
    if (dragItem.current === null || dragOver === null || dragItem.current === dragOver) {
      dragItem.current = null
      setDragOver(null)
      return
    }
    const newIds = [...selectedIds]
    const moved = newIds.splice(dragItem.current, 1)[0]
    if (moved !== undefined) newIds.splice(dragOver, 0, moved)
    onChange(newIds)
    dragItem.current = null
    setDragOver(null)
  }

  // Проверка совместимости
  function getCompatWarning(): string | null {
    if (selectedTemplates.length < 2) return null
    for (let i = 0; i < selectedTemplates.length - 1; i++) {
      const a = selectedTemplates[i]
      const b = selectedTemplates[i + 1]
      if (!a || !b) continue
      const aCompat = a.compatibleWith
      const bCompat = b.compatibleWith
      if (
        (aCompat.length > 0 && !aCompat.includes(b.slug)) ||
        (bCompat.length > 0 && !bCompat.includes(a.slug))
      ) {
        return `Возможная несовместимость: «${a.name}» и «${b.name}»`
      }
    }
    return null
  }

  const warning = getCompatWarning()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Левая колонка: библиотека */}
      <div className="space-y-3">
        <h3 className="font-semibold">Библиотека шаблонов</h3>
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск…"
            className="w-full rounded-[var(--radius-btn)] border bg-[var(--muted)] py-1.5 pr-3 pl-8 text-sm"
          />
        </div>

        {active.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Нет активных шаблонов.{' '}
            <Link
              href="/admin/js-constructor/templates/new"
              className="text-[var(--color-brand)] underline"
            >
              Создать
            </Link>
          </p>
        ) : (
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat}>
                <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
                  <Tag className="h-3 w-3" aria-hidden />
                  {cat}
                </div>
                <div className="space-y-1">
                  {filtered
                    .filter((t) => t.category === cat)
                    .map((t) => {
                      const isSelected = selectedIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggle(t.id)}
                          className={`flex w-full items-start gap-3 rounded-[var(--radius-card)] border px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5'
                              : 'hover:bg-[var(--accent)]'
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                              isSelected
                                ? 'border-[var(--color-brand)] bg-[var(--color-brand)]'
                                : 'border-[var(--border)]'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                viewBox="0 0 12 10"
                                className="h-2.5 w-2.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  d="M1 5l3 4L11 1"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {t.name}
                              <span className="rounded bg-[var(--muted)] px-1 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                                v{t.version}
                              </span>
                            </div>
                            {t.description && (
                              <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                                {t.description}
                              </p>
                            )}
                          </div>
                          <Plus
                            className={`mt-0.5 ml-auto h-4 w-4 shrink-0 ${
                              isSelected ? 'hidden' : 'text-[var(--muted-foreground)]'
                            }`}
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Правая колонка: выбранные + порядок */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          Выбрано{' '}
          <span className="ml-1 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-xs text-white">
            {selectedIds.length}
          </span>
        </h3>

        {warning && (
          <div className="flex items-start gap-2 rounded-[var(--radius-card)] border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 px-3 py-2 text-xs text-[var(--color-warning)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            {warning}
          </div>
        )}

        {selectedTemplates.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-[var(--radius-card)] border border-dashed text-sm text-[var(--muted-foreground)]">
            Выберите шаблоны слева
          </div>
        ) : (
          <div className="space-y-1">
            {selectedTemplates.map((t, idx) => (
              <div
                key={t.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-2 rounded-[var(--radius-card)] border bg-[var(--background)] px-3 py-2 transition-shadow ${
                  dragOver === idx ? 'shadow-lg ring-2 ring-[var(--color-brand)]' : ''
                }`}
              >
                <GripVertical
                  className="h-4 w-4 shrink-0 cursor-grab text-[var(--muted-foreground)] active:cursor-grabbing"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[10px] font-bold text-[var(--color-brand)]">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">{t.category}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--color-error)]"
                  title="Убрать"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTemplates.length > 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Перетащи строки, чтобы изменить порядок выполнения шаблонов.
          </p>
        )}
      </div>
    </div>
  )
}
