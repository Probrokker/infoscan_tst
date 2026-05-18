'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, Copy, Search, Download } from 'lucide-react'
import { deleteConfigAction, duplicateConfigAction } from './actions'

interface ConfigRow {
  id: string
  slug: string
  name: string
  description: string | null
  clientName: string | null
  templateIds: string[]
  updatedAt: string
  createdAt: string
  authorName: string | null
}

interface Props {
  configs: ConfigRow[]
}

export function ConfigsClient({ configs: initial }: Props) {
  const router = useRouter()
  const [configs, setConfigs] = React.useState(initial)
  const [search, setSearch] = React.useState('')

  React.useEffect(() => {
    setConfigs(initial)
  }, [initial])

  const filtered = configs.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.clientName ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  async function handleDuplicate(id: string, name: string) {
    const result = await duplicateConfigAction(id)
    if (result.ok) {
      toast.success(`«${name}» скопирован`)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  function handleDelete(id: string, name: string) {
    const tid = toast(`Удалить конфигурацию «${name}»?`, {
      action: {
        label: 'Удалить',
        onClick: async () => {
          const result = await deleteConfigAction(id)
          if (result.ok) {
            setConfigs((prev) => prev.filter((c) => c.id !== id))
            toast.success(`«${name}» удалён`)
          } else {
            toast.error(result.error ?? 'Ошибка')
          }
        },
      },
      cancel: { label: 'Отмена', onClick: () => toast.dismiss(tid) },
    })
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или клиенту…"
          className="w-full rounded-[var(--radius-btn)] border bg-[var(--muted)] py-1.5 pr-3 pl-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {c.clientName && (
                  <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                    {c.clientName}
                  </span>
                )}
                <span className="rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs text-[var(--color-brand)]">
                  {c.templateIds.length} шаблон(-ов)
                </span>
              </div>
              {c.description && (
                <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                  {c.description}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                Обновлён: {new Date(c.updatedAt).toLocaleDateString('ru-RU')}
                {c.authorName && ` · ${c.authorName}`}
              </p>
            </div>

            <div className="flex items-center gap-0.5">
              <Link
                href={`/admin/js-constructor/${c.id}`}
                className="flex items-center gap-1 rounded px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                title="Редактировать"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => void handleDuplicate(c.id, c.name)}
                className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                title="Дублировать"
              >
                <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </button>
              <a
                href={`/api/admin/js-config/${c.id}/download`}
                className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                title="Скачать .js"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => handleDelete(c.id, c.name)}
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
  )
}
