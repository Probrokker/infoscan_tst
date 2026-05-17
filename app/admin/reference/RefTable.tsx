'use client'

/**
 * Универсальная сортируемая таблица справочника.
 * Используется для DeviceModel, FirmwareVersion, TemplateVariable.
 */
import * as React from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { SortableList } from '@/components/admin/SortableList'

export interface ReferenceRow {
  id: string
  displayName?: string
  key?: string
  type?: string
  description?: string | null
  notes?: string | null
  example?: string | null
  isActive?: boolean
  slug?: string
}

interface Column {
  key: keyof ReferenceRow
  label: string
  placeholder?: string
  hint?: string
  width?: string
}

interface RefTableProps {
  items: ReferenceRow[]
  columns: Column[]
  onReorder: (ids: string[]) => Promise<void>
  onCreate: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>
  onUpdate: (id: string, formData: FormData) => Promise<{ ok?: boolean; error?: string }>
  onDelete: (id: string) => Promise<{ ok?: boolean; error?: string }>
  nameKey?: keyof ReferenceRow
  hasActive?: boolean
}

export function RefTable({
  items: initial,
  columns,
  onReorder,
  onCreate,
  onUpdate,
  onDelete,
  nameKey = 'displayName',
  hasActive = false,
}: RefTableProps) {
  const [items, setItems] = React.useState(initial)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValues, setEditValues] = React.useState<Record<string, string>>({})
  const [showAdd, setShowAdd] = React.useState(false)
  const [newValues, setNewValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setItems(initial)
  }, [initial])

  function startEdit(item: ReferenceRow) {
    setEditingId(item.id)
    const vals: Record<string, string> = {}
    columns.forEach((c) => {
      vals[c.key as string] = String(item[c.key] ?? '')
    })
    if (hasActive) vals.isActive = String(item.isActive ?? true)
    setEditValues(vals)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const fd = new FormData()
    Object.entries(editValues).forEach(([k, v]) => fd.append(k, v))
    const result = await onUpdate(id, fd)
    setSaving(false)
    if (result.ok) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                ...Object.fromEntries(columns.map((c) => [c.key, editValues[c.key as string]])),
              }
            : it,
        ),
      )
      setEditingId(null)
      toast.success('Сохранено')
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function handleDelete(id: string, name: string) {
    const result = await onDelete(id)
    if (result.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id))
      toast.success(`«${name}» удалён`)
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function handleAdd() {
    const requiredCol = columns[0]
    if (!requiredCol || !newValues[requiredCol.key as string]?.trim()) return
    setSaving(true)
    const fd = new FormData()
    Object.entries(newValues).forEach(([k, v]) => fd.append(k, v))
    const result = await onCreate(fd)
    setSaving(false)
    if (result.ok) {
      window.location.reload()
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  function cell(
    col: Column,
    values: Record<string, string>,
    onChange: (k: string, v: string) => void,
    _firstCol = false,
  ) {
    if (col.key === 'type') {
      return (
        <select
          id={`field-${col.key}`}
          value={values[col.key as string] ?? 'string'}
          onChange={(e) => onChange(col.key as string, e.target.value)}
          className="w-full rounded border bg-[var(--muted)] px-2 py-1 text-sm"
        >
          {['string', 'number', 'boolean', 'date', 'list'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      )
    }
    return (
      <input
        id={`field-${col.key}`}
        value={values[col.key as string] ?? ''}
        onChange={(e) => onChange(col.key as string, e.target.value)}
        placeholder={col.placeholder ?? col.label}
        className="w-full rounded border bg-[var(--muted)] px-2 py-1 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (editingId) setEditingId(null)
            else setShowAdd(false)
          }
        }}
      />
    )
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
        <div className="w-6" />
        {columns.map((c) => (
          <div key={c.key as string} className={`min-w-0 flex-1 ${c.width ?? ''}`}>
            {c.label}
          </div>
        ))}
        {hasActive && <div className="w-16">Активна</div>}
        <div className="w-16" />
      </div>

      <SortableList
        items={items}
        onReorder={onReorder}
        className="space-y-1"
        renderItem={(item, { dragHandle }) => {
          const name = String(item[nameKey] ?? '')
          return (
            <div className="flex items-center gap-2 rounded-[var(--radius-card)] border bg-[var(--background)] px-3 py-2">
              {dragHandle}

              {editingId === item.id ? (
                <>
                  {columns.map((c) => (
                    <div key={c.key as string} className={`min-w-0 flex-1 ${c.width ?? ''}`}>
                      {cell(c, editValues, (k, v) => setEditValues((p) => ({ ...p, [k]: v })))}
                    </div>
                  ))}
                  {hasActive && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditValues((p) => ({ ...p, isActive: String(p.isActive !== 'true') }))
                      }
                      className="w-16 text-[var(--muted-foreground)]"
                      title={editValues.isActive === 'true' ? 'Активна' : 'Неактивна'}
                    >
                      {editValues.isActive === 'true' ? (
                        <ToggleRight
                          className="h-5 w-5 text-[var(--color-success)]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      ) : (
                        <ToggleLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  )}
                  <div className="flex w-16 items-center justify-end gap-0.5">
                    <button
                      type="button"
                      onClick={() => void saveEdit(item.id)}
                      disabled={saving}
                      className="rounded p-1 text-[var(--color-success)] hover:bg-[var(--accent)]"
                      title="Сохранить"
                    >
                      <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                      title="Отмена"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {columns.map((c) => (
                    <div key={c.key as string} className={`min-w-0 flex-1 ${c.width ?? ''}`}>
                      <span className="truncate text-sm">{String(item[c.key] ?? '—')}</span>
                    </div>
                  ))}
                  {hasActive && (
                    <div className="w-16">
                      {item.isActive ? (
                        <ToggleRight
                          className="h-5 w-5 text-[var(--color-success)]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      ) : (
                        <ToggleLeft
                          className="h-5 w-5 text-[var(--muted-foreground)]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      )}
                    </div>
                  )}
                  <div className="flex w-16 items-center justify-end gap-0.5">
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
                      onClick={() => void handleDelete(item.id, name)}
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        }}
      />

      {/* Добавить */}
      {showAdd ? (
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-3 py-2">
          <div className="w-6" />
          {columns.map((c) => (
            <div key={c.key as string} className={`min-w-0 flex-1 ${c.width ?? ''}`}>
              {cell(c, newValues, (k, v) => setNewValues((p) => ({ ...p, [k]: v })), true)}
            </div>
          ))}
          {hasActive && <div className="w-16" />}
          <div className="flex w-16 items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={saving}
              className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-2 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              ОК
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setNewValues({})
              }}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Добавить
        </button>
      )}
    </div>
  )
}
