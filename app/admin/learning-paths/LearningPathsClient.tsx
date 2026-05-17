'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X, Plus, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { SortableList } from '@/components/admin/SortableList'
import {
  createLearningPathAction,
  updateLearningPathAction,
  deleteLearningPathAction,
  reorderLearningPathsAction,
  addLearningPathStepAction,
  deleteLearningPathStepAction,
  reorderLearningPathStepsAction,
} from './actions'

interface Step {
  id: string
  articleSlug: string
  notes: string | null
  order: number
}

interface PathItem {
  id: string
  slug: string
  title: string
  description: string
  isPublished: boolean
  steps: Step[]
}

interface LearningPathsClientProps {
  paths: PathItem[]
  articleSlugs: string[]
}

export function LearningPathsClient({ paths: initial, articleSlugs }: LearningPathsClientProps) {
  const [paths, setPaths] = React.useState(initial)
  const [openPathId, setOpenPathId] = React.useState<string | null>(null)
  const [editingPathId, setEditingPathId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const [editDesc, setEditDesc] = React.useState('')
  const [editPublished, setEditPublished] = React.useState(false)
  const [showAdd, setShowAdd] = React.useState(false)
  const [newTitle, setNewTitle] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')
  const [newStep, setNewStep] = React.useState<{
    pathId: string
    slug: string
    notes: string
  } | null>(null)
  const [saving, setSaving] = React.useState(false)

  function startEdit(p: PathItem) {
    setEditingPathId(p.id)
    setEditTitle(p.title)
    setEditDesc(p.description)
    setEditPublished(p.isPublished)
  }

  async function savePath(id: string) {
    setSaving(true)
    const fd = new FormData()
    fd.append('title', editTitle)
    fd.append('description', editDesc)
    fd.append('isPublished', String(editPublished))
    const result = await updateLearningPathAction(id, fd)
    setSaving(false)
    if (result.ok) {
      setPaths((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, title: editTitle, description: editDesc, isPublished: editPublished }
            : p,
        ),
      )
      setEditingPathId(null)
      toast.success('Учебный путь сохранён')
    } else toast.error(result.error ?? 'Ошибка')
  }

  async function deletePath(id: string, title: string) {
    const result = await deleteLearningPathAction(id)
    if (result.ok) {
      setPaths((prev) => prev.filter((p) => p.id !== id))
      toast.success(`«${title}» удалён`)
    } else toast.error(result.error ?? 'Ошибка')
  }

  async function handleAddPath() {
    if (!newTitle.trim() || !newDesc.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('title', newTitle)
    fd.append('description', newDesc)
    const result = await createLearningPathAction(fd)
    setSaving(false)
    if (result.ok) window.location.reload()
    else toast.error(result.error ?? 'Ошибка')
  }

  async function handleAddStep(pathId: string) {
    if (!newStep || newStep.pathId !== pathId || !newStep.slug.trim()) return
    setSaving(true)
    const fd = new FormData()
    fd.append('articleSlug', newStep.slug)
    if (newStep.notes) fd.append('notes', newStep.notes)
    const result = await addLearningPathStepAction(pathId, fd)
    setSaving(false)
    if (result.ok) window.location.reload()
    else toast.error(result.error ?? 'Ошибка')
  }

  async function handleDeleteStep(pathId: string, stepId: string) {
    const result = await deleteLearningPathStepAction(stepId)
    if (result.ok) {
      setPaths((prev) =>
        prev.map((p) =>
          p.id === pathId ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p,
        ),
      )
      toast.success('Шаг удалён')
    } else toast.error(result.error ?? 'Ошибка')
  }

  return (
    <div className="space-y-3">
      <SortableList
        items={paths}
        onReorder={async (ids) => {
          const r = await reorderLearningPathsAction(ids)
          if (!r.ok) throw new Error(r.error)
        }}
        className="space-y-2"
        renderItem={(path, { dragHandle }) => (
          <div className="rounded-[var(--radius-card)] border bg-[var(--background)]">
            <div className="flex items-center gap-2 px-3 py-2.5">
              {dragHandle}
              {editingPathId === path.id ? (
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    id={`edit-path-title-${path.id}`}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded border bg-[var(--muted)] px-2 py-1 text-sm font-medium"
                  />
                  <input
                    id={`edit-path-desc-${path.id}`}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Описание"
                    className="rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editPublished}
                      onChange={(e) => setEditPublished(e.target.checked)}
                    />
                    Опубликован
                  </label>
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <BookOpen
                      className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <span className="font-medium">{path.title}</span>
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${path.isPublished ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}
                    >
                      {path.isPublished ? 'Публичный' : 'Черновик'}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {path.steps.length} шагов
                    </span>
                  </div>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {path.description}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-0.5">
                {editingPathId === path.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void savePath(path.id)}
                      disabled={saving}
                      className="rounded p-1.5 text-[var(--color-success)] hover:bg-[var(--accent)]"
                      title="Сохранить"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPathId(null)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Отмена"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(path)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Редактировать"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePath(path.id, path.title)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenPathId(openPathId === path.id ? null : path.id)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Шаги"
                    >
                      {openPathId === path.id ? (
                        <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Steps */}
            {openPathId === path.id && (
              <div className="border-t px-4 pt-2 pb-3">
                <SortableList
                  items={path.steps}
                  onReorder={async (ids) => {
                    const r = await reorderLearningPathStepsAction(path.id, ids)
                    if (!r.ok) throw new Error(r.error)
                  }}
                  className="mb-2 space-y-1"
                  renderItem={(step, { dragHandle }) => (
                    <div className="flex items-center gap-2 rounded border bg-[var(--muted)] px-2 py-1.5 text-sm">
                      {dragHandle}
                      <span className="flex-1 font-mono">{step.articleSlug}</span>
                      {step.notes && (
                        <span className="text-xs text-[var(--muted-foreground)]">{step.notes}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDeleteStep(path.id, step.id)}
                        className="rounded p-1 text-[var(--muted-foreground)] hover:text-[var(--color-error)]"
                        title="Удалить шаг"
                      >
                        <X className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                      </button>
                    </div>
                  )}
                />

                {/* Добавить шаг */}
                {newStep?.pathId === path.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      id={`new-step-slug-${path.id}`}
                      value={newStep.slug}
                      onChange={(e) => setNewStep({ ...newStep, slug: e.target.value })}
                      className="flex-1 rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
                    >
                      <option value="">— выбери статью —</option>
                      {articleSlugs.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      id={`new-step-notes-${path.id}`}
                      value={newStep.notes}
                      onChange={(e) => setNewStep({ ...newStep, notes: e.target.value })}
                      placeholder="Примечание"
                      className="w-40 rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddStep(path.id)}
                      disabled={saving || !newStep.slug}
                      className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      ОК
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStep(null)}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNewStep({ pathId: path.id, slug: '', notes: '' })}
                    className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Добавить шаг
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      />

      {/* Новый путь */}
      {showAdd ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-dashed p-3">
          <input
            id="new-path-title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название пути *"
            className="rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
          />
          <input
            id="new-path-desc"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Описание *"
            className="rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleAddPath()}
              disabled={saving || !newTitle.trim() || !newDesc.trim()}
              className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
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
          className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Добавить учебный путь
        </button>
      )}
    </div>
  )
}
