'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { ArticleStatus, type Audience } from '@prisma/client'
import { ExternalLink, Clock } from 'lucide-react'
import { updateArticleAction, type ActionResult } from '../../actions'
import { AudienceCheckboxes, STATUS_LABEL } from '../../components/AudienceCheckboxes'

interface ArticleData {
  id: string
  title: string
  description: string
  sectionId: string
  slug: string
  fullSlug: string
  audience: Audience[]
  order: number
  status: ArticleStatus
  related: string[]
  body: string
}

interface VersionEntry {
  id: string
  version: number
  createdAt: string
  comment?: string
  authorName?: string
}

const INITIAL: ActionResult = {}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-btn)] bg-[var(--color-yellow-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-black-brand)] hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Сохраняем...' : 'Сохранить'}
    </button>
  )
}

export function ArticleEditForm({
  article,
  sections,
  versions,
}: {
  article: ArticleData
  sections: Array<{ id: string; title: string; slug: string }>
  versions: VersionEntry[]
}) {
  const [state, formAction] = useActionState(updateArticleAction, INITIAL)

  React.useEffect(() => {
    if (state.ok) toast.success('Сохранено')
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={article.id} />

        <div>
          <label htmlFor="edit-title" className="mb-1.5 block text-sm font-medium">
            Название <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            id="edit-title"
            name="title"
            required
            defaultValue={article.title}
            className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
          />
        </div>

        <div>
          <label htmlFor="edit-description" className="mb-1.5 block text-sm font-medium">
            Описание <span className="text-[var(--color-error)]">*</span>
          </label>
          <textarea
            id="edit-description"
            name="description"
            required
            rows={2}
            defaultValue={article.description}
            className="w-full resize-none rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-section" className="mb-1.5 block text-sm font-medium">
              Раздел
            </label>
            <select
              id="edit-section"
              name="sectionId"
              defaultValue={article.sectionId}
              className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-status" className="mb-1.5 block text-sm font-medium">
              Статус
            </label>
            <select
              id="edit-status"
              name="status"
              defaultValue={article.status}
              className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              {Object.values(ArticleStatus).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Аудитория</p>
          <AudienceCheckboxes defaultValues={article.audience} />
        </div>

        <div>
          <label htmlFor="edit-order" className="mb-1.5 block text-sm font-medium">
            Порядок
          </label>
          <input
            id="edit-order"
            name="order"
            type="number"
            defaultValue={article.order}
            min={0}
            className="w-32 rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
          />
        </div>

        {/* Slug и ссылка на сайт */}
        <div className="rounded-[var(--radius-card)] border bg-[var(--muted)] p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--muted-foreground)]">
              Slug:{' '}
              <code className="rounded bg-[var(--background)] px-1 font-mono text-xs">
                {article.fullSlug}
              </code>
            </span>
            {article.status === ArticleStatus.PUBLISHED && (
              <a
                href={`/${article.fullSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                Открыть на сайте
              </a>
            )}
          </div>
        </div>

        {/* MDX editor placeholder */}
        <div className="rounded-[var(--radius-card)] border border-dashed p-6 text-center">
          <p className="text-sm font-medium">Редактор MDX</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Появится на шаге 6 (CodeMirror + slash-команды + image paste + превью)
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--muted-foreground)] opacity-60">
            {article.body.slice(0, 120)}
            {article.body.length > 120 ? '…' : ''}
          </p>
        </div>

        {state.error && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-sm text-[var(--color-error)]">
            {state.error}
          </div>
        )}

        <div className="flex gap-3">
          <SubmitBtn />
        </div>
      </form>

      {/* История версий */}
      {versions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold">История версий</h2>
          <ul className="space-y-1.5">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border px-3 py-2 text-xs"
              >
                <Clock
                  className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]"
                  strokeWidth={1.5}
                />
                <span className="font-medium">v{v.version}</span>
                <span className="text-[var(--muted-foreground)]">
                  {new Date(v.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {v.authorName && (
                  <span className="text-[var(--muted-foreground)]">{v.authorName}</span>
                )}
                {v.comment && (
                  <span className="truncate text-[var(--muted-foreground)]">{v.comment}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
