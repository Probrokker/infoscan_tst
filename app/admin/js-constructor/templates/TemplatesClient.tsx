'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, ToggleLeft, ToggleRight, Search, Tag } from 'lucide-react'
import { deleteTemplateAction, toggleTemplateActiveAction } from '../actions'

interface TemplateRow {
  id: string
  slug: string
  name: string
  category: string
  version: string
  isActive: boolean
  order: number
  description: string | null
  compatibleWith: string[]
  _count: { configs: number }
}

interface Props {
  templates: TemplateRow[]
}

export function TemplatesClient({ templates: initial }: Props) {
  const router = useRouter()
  const [templates, setTemplates] = React.useState(initial)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    setTemplates(initial)
  }, [initial])

  const filtered = templates.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped: Record<string, TemplateRow[]> = {}
  for (const t of filtered) {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category]!.push(t)
  }

  async function handleToggleActive(id: string, isActive: boolean, name: string) {
    const result = await toggleTemplateActiveAction(id, isActive)
    if (result.ok) {
      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isActive } : t)))
      toast.success(`«${name}» ${isActive ? 'активирован' : 'деактивирован'}`)
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  function handleDelete(id: string, name: string, usedCount: number) {
    if (usedCount > 0) {
      toast.error(`Шаблон используется в ${usedCount} конфигурациях. Сначала удалите их.`)
      return
    }
    const tid = toast(`Удалить «${name}»?`, {
      action: {
        label: 'Удалить',
        onClick: async () => {
          const result = await deleteTemplateAction(id)
          if (result.ok) {
            setTemplates((prev) => prev.filter((t) => t.id !== id))
            toast.success(`«${name}» удалён`)
            router.refresh()
          } else {
            toast.error(result.error ?? 'Ошибка')
          }
        },
      },
      cancel: { label: 'Отмена', onClick: () => toast.dismiss(tid) },
    })
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed py-16 text-center text-[var(--muted-foreground)]">
        Шаблонов пока нет.{' '}
        <Link
          href="/admin/js-constructor/templates/new"
          className="text-[var(--color-brand)] underline"
        >
          Создать первый
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию, категории, slug…"
          className="w-full rounded-[var(--radius-btn)] border bg-[var(--muted)] py-1.5 pr-3 pl-8 text-sm"
        />
      </div>

      {/* Категории */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
            <Tag className="h-3.5 w-3.5" aria-hidden />
            {category}
            <span className="ml-1 rounded-full bg-[var(--muted)] px-1.5 py-0.5 font-normal">
              {items.length}
            </span>
          </div>
          <div className="space-y-1">
            {items.map((t) => (
              <div
                key={t.id}
                className={`flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border px-4 py-3 ${
                  !t.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    <span className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      v{t.version}
                    </span>
                    {!t.isActive && (
                      <span className="rounded-full bg-[var(--color-error)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-error)]">
                        Неактивен
                      </span>
                    )}
                    {t._count.configs > 0 && (
                      <span className="rounded-full bg-[var(--color-brand)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-brand)]">
                        {t._count.configs} конф.
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                      {t.description}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--muted-foreground)]">/{t.slug}</p>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(t.id, !t.isActive, t.name)}
                    title={t.isActive ? 'Деактивировать' : 'Активировать'}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  >
                    {t.isActive ? (
                      <ToggleRight
                        className="h-4 w-4 text-[var(--color-success)]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    ) : (
                      <ToggleLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    )}
                  </button>
                  <Link
                    href={`/admin/js-constructor/templates/${t.id}`}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    title="Редактировать"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id, t.name, t._count.configs)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
