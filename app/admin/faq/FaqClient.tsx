'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { SortableList } from '@/components/admin/SortableList'
import {
  createFaqItemAction,
  updateFaqItemAction,
  deleteFaqItemAction,
  reorderFaqItemsAction,
} from './actions'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
  isPublished: boolean
  order: number
}

export function FaqClient({ items: initial }: { items: FaqItem[] }) {
  const [items, setItems] = React.useState(initial)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editQ, setEditQ] = React.useState('')
  const [editA, setEditA] = React.useState('')
  const [editCat, setEditCat] = React.useState('')
  const [editPub, setEditPub] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [newQ, setNewQ] = React.useState('')
  const [newA, setNewA] = React.useState('')
  const [newCat, setNewCat] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  function startEdit(item: FaqItem) {
    setEditingId(item.id)
    setEditQ(item.question)
    setEditA(item.answer)
    setEditCat(item.category ?? '')
    setEditPub(item.isPublished)
    setExpandedId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const fd = new FormData()
    fd.append('question', editQ)
    fd.append('answer', editA)
    fd.append('category', editCat)
    fd.append('isPublished', String(editPub))
    const result = await updateFaqItemAction(id, fd)
    setSaving(false)
    if (result.ok) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                question: editQ,
                answer: editA,
                category: editCat || null,
                isPublished: editPub,
              }
            : it,
        ),
      )
      setEditingId(null)
      toast.success('Вопрос сохранён')
    } else toast.error(result.error ?? 'Ошибка')
  }

  async function handleDelete(id: string, _question: string) {
    const result = await deleteFaqItemAction(id)
    if (result.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id))
      toast.success('Вопрос удалён')
    } else toast.error(result.error ?? 'Ошибка')
  }

  async function handleAdd() {
    if (!newQ.trim() || !newA.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('question', newQ)
    fd.append('answer', newA)
    fd.append('category', newCat)
    fd.append('isPublished', 'true')
    const result = await createFaqItemAction(fd)
    setSaving(false)
    if (result.ok) window.location.reload()
    else toast.error(result.error ?? 'Ошибка')
  }

  return (
    <div className="space-y-2">
      <SortableList
        items={items}
        onReorder={async (ids) => {
          const r = await reorderFaqItemsAction(ids)
          if (!r.ok) throw new Error(r.error)
        }}
        className="space-y-1.5"
        renderItem={(item, { dragHandle }) => (
          <div className="rounded-[var(--radius-card)] border bg-[var(--background)]">
            {editingId === item.id ? (
              <div className="flex gap-2 p-3">
                {dragHandle}
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    id={`edit-q-${item.id}`}
                    value={editQ}
                    onChange={(e) => setEditQ(e.target.value)}
                    placeholder="Вопрос *"
                    className="rounded border bg-[var(--muted)] px-2 py-1 text-sm font-medium"
                  />
                  <textarea
                    id={`edit-a-${item.id}`}
                    value={editA}
                    onChange={(e) => setEditA(e.target.value)}
                    placeholder="Ответ *"
                    rows={3}
                    className="resize-none rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      id={`edit-cat-${item.id}`}
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      placeholder="Категория"
                      className="flex-1 rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={editPub}
                        onChange={(e) => setEditPub(e.target.checked)}
                      />{' '}
                      Опубликован
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveEdit(item.id)}
                      disabled={saving}
                      className="rounded p-1.5 text-[var(--color-success)] hover:bg-[var(--accent)]"
                      title="Сохранить"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Отмена"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {dragHandle}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.question}</span>
                      {item.category && (
                        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                          {item.category}
                        </span>
                      )}
                      {!item.isPublished && (
                        <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                          черновик
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Редактировать"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id, item.question)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    >
                      {expandedId === item.id ? (
                        <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div className="border-t px-4 pt-2 pb-3 text-sm text-[var(--muted-foreground)]">
                    {item.answer}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      />

      {showAdd ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-dashed p-3">
          <input
            id="new-faq-q"
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="Вопрос *"
            className="rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
          />
          <textarea
            id="new-faq-a"
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            placeholder="Ответ *"
            rows={3}
            className="resize-none rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
          />
          <input
            id="new-faq-cat"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Категория"
            className="rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving || !newQ.trim() || !newA.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setNewQ('')
                setNewA('')
                setNewCat('')
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
          className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Добавить вопрос
        </button>
      )}
    </div>
  )
}
