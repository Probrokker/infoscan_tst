'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { SortableList } from '@/components/admin/SortableList'
import {
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
} from './actions'

interface SectionItem {
  id: string
  slug: string
  title: string
  description: string | null
  _count: { articles: number }
}

interface SectionsClientProps {
  sections: SectionItem[]
}

export function SectionsClient({ sections: initial }: SectionsClientProps) {
  const [sections, setSections] = React.useState(initial)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const [editDesc, setEditDesc] = React.useState('')
  const [showAdd, setShowAdd] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  function startEdit(s: SectionItem) {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditDesc(s.description ?? '')
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const fd = new FormData()
    fd.append('title', editTitle)
    fd.append('description', editDesc)
    const result = await updateSectionAction(id, fd)
    setSaving(false)
    if (result.ok) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title: editTitle, description: editDesc || null } : s,
        ),
      )
      setEditingId(null)
      toast.success('Раздел сохранён')
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function handleDelete(id: string, title: string) {
    const result = await deleteSectionAction(id)
    if (result.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id))
      toast.success(`Раздел «${title}» удалён`)
    } else {
      toast.error(result.error ?? 'Ошибка удаления')
    }
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('title', newTitle)
    fd.append('description', newDesc)
    const result = await createSectionAction(fd)
    setSaving(false)
    if (result.ok) {
      // Перезагрузка — проще всего т.к. нужен id + slug с сервера
      window.location.reload()
    } else {
      toast.error(result.error ?? 'Ошибка создания')
    }
  }

  async function handleReorder(newIds: string[]) {
    const result = await reorderSectionsAction(newIds)
    if (!result.ok) throw new Error(result.error)
    // обновляем локально
    setSections((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]))
      return newIds.map((id) => map.get(id)!).filter(Boolean)
    })
  }

  return (
    <div className="space-y-4">
      {/* Список */}
      <SortableList
        items={sections}
        onReorder={handleReorder}
        className="space-y-1"
        renderItem={(section, { dragHandle }) => (
          <div className="flex items-center gap-2 rounded-[var(--radius-card)] border bg-[var(--background)] px-3 py-2">
            {dragHandle}

            {editingId === section.id ? (
              <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
                <input
                  id={`edit-title-${section.id}`}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveEdit(section.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <input
                  id={`edit-desc-${section.id}`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Описание (необязательно)"
                  className="flex-1 rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveEdit(section.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void saveEdit(section.id)}
                    disabled={saving}
                    className="rounded p-1.5 text-[var(--color-success)] hover:bg-[var(--accent)]"
                    title="Сохранить (Enter)"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    title="Отмена (Esc)"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{section.title}</span>
                  <span className="ml-2 font-mono text-xs text-[var(--muted-foreground)]">
                    /{section.slug}
                  </span>
                  {section.description && (
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {section.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {section._count.articles} ст.
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => startEdit(section)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    title="Редактировать"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(section.id, section.title)}
                    disabled={section._count.articles > 0}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] disabled:cursor-not-allowed disabled:opacity-30"
                    title={
                      section._count.articles > 0
                        ? `Нельзя удалить: ${section._count.articles} статей`
                        : 'Удалить раздел'
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      />

      {/* Добавить раздел */}
      {showAdd ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-dashed p-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              id="new-section-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название раздела *"
              className="flex-1 rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAdd()
                if (e.key === 'Escape') setShowAdd(false)
              }}
            />
            <input
              id="new-section-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Описание (необязательно)"
              className="flex-1 rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAdd()
                if (e.key === 'Escape') setShowAdd(false)
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !newTitle.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setNewTitle('')
                setNewDesc('')
              }}
              className="rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Добавить раздел
        </button>
      )}
    </div>
  )
}
