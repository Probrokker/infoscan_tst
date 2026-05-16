'use client'

/**
 * Клиентская часть создания статьи: выбор шаблона → форма метаданных.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { ArticleStatus } from '@prisma/client'
import { ARTICLE_TEMPLATES } from '@/lib/article-templates'
import { createArticleAction, type ActionResult } from '../actions'
import { AudienceCheckboxes } from '../components/AudienceCheckboxes'

interface Section {
  id: string
  title: string
  slug: string
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
      {pending ? 'Сохраняем...' : 'Создать статью'}
    </button>
  )
}

export function NewArticleClient({ sections }: { sections: Section[] }) {
  const router = useRouter()
  const [step, setStep] = React.useState<'template' | 'form'>('template')
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('blank')
  const [state, formAction] = useActionState(createArticleAction, INITIAL)

  // Успешное создание → переходим на редактирование
  React.useEffect(() => {
    if (state.ok && state.id) {
      toast.success('Статья создана')
      router.push(`/admin/articles/${state.id}/edit`)
    }
    if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const template = ARTICLE_TEMPLATES.find((t) => t.id === selectedTemplate) ?? ARTICLE_TEMPLATES[0]!

  if (step === 'template') {
    return (
      <div>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Выбери шаблон. Структуру можно изменить в редакторе.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedTemplate(t.id)
                setStep('form')
              }}
              className="flex flex-col items-start gap-2 rounded-[var(--radius-card)] border bg-[var(--card)] p-4 text-left transition-colors hover:border-[var(--color-yellow-brand)] hover:bg-[var(--accent)]"
            >
              <span className="text-2xl">{t.icon}</span>
              <div>
                <div className="font-medium">{t.label}</div>
                <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setStep('template')}
        className="mb-6 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        ← Сменить шаблон ({template?.icon} {template?.label})
      </button>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="body" value={template?.body ?? ''} />

        <div>
          <label htmlFor="new-title" className="mb-1.5 block text-sm font-medium">
            Название <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            id="new-title"
            name="title"
            required
            placeholder="Например: Измерение объектов за 3 шага"
            className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
          />
        </div>

        <div>
          <label htmlFor="new-description" className="mb-1.5 block text-sm font-medium">
            Описание (для SEO и карточек) <span className="text-[var(--color-error)]">*</span>
          </label>
          <textarea
            id="new-description"
            name="description"
            required
            rows={2}
            placeholder="Одно-два предложения, суть статьи."
            className="w-full resize-none rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-section" className="mb-1.5 block text-sm font-medium">
              Раздел <span className="text-[var(--color-error)]">*</span>
            </label>
            <select
              id="new-section"
              name="sectionId"
              required
              className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value="">— Выберите раздел —</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="new-status" className="mb-1.5 block text-sm font-medium">
              Статус
            </label>
            <select
              id="new-status"
              name="status"
              defaultValue={ArticleStatus.DRAFT}
              className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
            >
              <option value={ArticleStatus.DRAFT}>Черновик</option>
              <option value={ArticleStatus.PUBLISHED}>Опубликовать сразу</option>
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Аудитория</p>
          <AudienceCheckboxes />
        </div>

        <div>
          <label htmlFor="new-order" className="mb-1.5 block text-sm font-medium">
            Порядок (число)
          </label>
          <input
            id="new-order"
            name="order"
            type="number"
            defaultValue={0}
            min={0}
            className="w-32 rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none"
          />
        </div>

        {state.error && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-sm text-[var(--color-error)]">
            {state.error}
          </div>
        )}

        <div className="flex gap-3">
          <SubmitBtn />
          <button
            type="button"
            onClick={() => router.push('/admin/articles')}
            className="rounded-[var(--radius-btn)] border px-4 py-2 text-sm hover:bg-[var(--accent)]"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
