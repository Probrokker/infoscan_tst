'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { ArticleStatus, type Audience } from '@prisma/client'
import { ExternalLink, Clock, RotateCcw, Eye, EyeOff } from 'lucide-react'
import {
  updateArticleAction,
  updateArticleBodyAction,
  publishArticleAction,
  rollbackArticleAction,
  type ActionResult,
} from '../../actions'
import { AudienceCheckboxes, STATUS_LABEL } from '../../components/AudienceCheckboxes'
import { MdxEditor } from '@/components/admin/MdxEditor'
import { MdxPreview } from '@/components/admin/MdxPreview'

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
  const [saving, setSaving] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [currentBody, setCurrentBody] = React.useState(article.body)
  const [currentStatus, setCurrentStatus] = React.useState(article.status)

  React.useEffect(() => {
    if (state.ok) toast.success('Метаданные сохранены')
    if (state.error) toast.error(state.error)
  }, [state])

  async function handleBodySave(body: string) {
    setSaving(true)
    setCurrentBody(body)
    const result = await updateArticleBodyAction(article.id, body)
    setSaving(false)
    if (!result.ok) toast.error(result.error ?? 'Ошибка сохранения')
  }

  async function handlePublishToggle() {
    const publish = currentStatus !== ArticleStatus.PUBLISHED
    const result = await publishArticleAction(article.id, publish)
    if (result.ok) {
      setCurrentStatus(publish ? ArticleStatus.PUBLISHED : ArticleStatus.DRAFT)
      toast.success(publish ? 'Статья опубликована' : 'Статья снята с публикации')
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function handleRollback(versionId: string, versionNum: number) {
    const result = await rollbackArticleAction(article.id, versionId)
    if (result.ok) {
      toast.success(`Откатили до версии ${versionNum}. Обновите страницу.`)
    } else {
      toast.error(result.error ?? 'Ошибка отката')
    }
  }

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

        {state.error && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-sm text-[var(--color-error)]">
            {state.error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SubmitBtn />
          <button
            type="button"
            onClick={() => void handlePublishToggle()}
            className={`rounded-[var(--radius-btn)] px-4 py-2 text-sm font-semibold transition-colors ${
              currentStatus === ArticleStatus.PUBLISHED
                ? 'border border-[var(--color-error)]/40 text-[var(--color-error)] hover:bg-[var(--color-error)]/5'
                : 'border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20'
            }`}
          >
            {currentStatus === ArticleStatus.PUBLISHED ? 'Снять с публикации' : 'Опубликовать'}
          </button>
          {article.status === ArticleStatus.PUBLISHED && (
            <a
              href={`/${article.fullSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
              На сайте
            </a>
          )}
        </div>
      </form>

      {/* MDX редактор */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Содержимое статьи (MDX)</h2>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="animate-pulse text-xs text-[var(--muted-foreground)]">
                Сохраняю…
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-3 py-1.5 text-xs hover:bg-[var(--accent)]"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Скрыть превью
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Превью
                </>
              )}
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Автосохранение через 2с бездействия · Cmd+S — сохранить сейчас · / — slash-команды ·
          Вставь картинку (Ctrl+V или перетащи)
        </p>

        {showPreview ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <MdxEditor
              initialValue={article.body}
              articleId={article.id}
              onSave={handleBodySave}
              saving={saving}
            />
            <MdxPreview body={currentBody} />
          </div>
        ) : (
          <MdxEditor
            initialValue={article.body}
            articleId={article.id}
            onSave={handleBodySave}
            saving={saving}
          />
        )}
      </div>

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
                  <span className="flex-1 truncate text-[var(--muted-foreground)]">
                    {v.comment}
                  </span>
                )}
                <button
                  type="button"
                  title={`Откатить до версии ${v.version}`}
                  onClick={() => void handleRollback(v.id, v.version)}
                  className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                  Откат
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
