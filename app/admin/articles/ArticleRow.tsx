'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { ArticleStatus } from '@prisma/client'
import { softDeleteArticleAction, restoreArticleAction } from './actions'

interface ArticleRowProps {
  article: {
    id: string
    title: string
    slug: string
    fullSlug: string
    sectionTitle: string
    status: ArticleStatus
    audience: string
    updatedAt: string
  }
}

const STATUS_STYLES: Record<ArticleStatus, string> = {
  [ArticleStatus.PUBLISHED]:
    'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30',
  [ArticleStatus.DRAFT]:
    'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]',
  [ArticleStatus.ARCHIVED]:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300',
}

const STATUS_LABEL: Record<ArticleStatus, string> = {
  [ArticleStatus.PUBLISHED]: 'Опубликовано',
  [ArticleStatus.DRAFT]: 'Черновик',
  [ArticleStatus.ARCHIVED]: 'Архив',
}

export function ArticleRow({ article }: ArticleRowProps) {
  const router = useRouter()

  async function handleDelete() {
    const result = await softDeleteArticleAction(article.id)
    if (!result.ok) {
      toast.error(result.error ?? 'Ошибка удаления')
      return
    }

    let undone = false
    toast('Статья удалена', {
      description: article.title,
      duration: 5000,
      action: {
        label: 'Отменить',
        onClick: async () => {
          undone = true
          const r = await restoreArticleAction(article.id)
          if (r.ok) {
            toast.success('Удаление отменено')
            router.refresh()
          } else {
            toast.error('Не удалось отменить')
          }
        },
      },
      onDismiss: () => {
        if (!undone) {
          // Настоящее удаление можно сделать здесь — пока оставляем soft-deleted.
          // На шаге 8 добавим permanent-delete по таймауту.
        }
      },
    })

    router.refresh()
  }

  return (
    <tr className="group transition-colors hover:bg-[var(--accent)]/50">
      <td className="max-w-xs px-4 py-3">
        <div className="truncate font-medium">{article.title}</div>
        <div className="truncate font-mono text-xs text-[var(--muted-foreground)]">
          {article.slug}
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-[var(--muted-foreground)] md:table-cell">
        {article.sectionTitle}
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[article.status]}`}
        >
          {STATUS_LABEL[article.status]}
        </span>
      </td>
      <td className="hidden px-4 py-3 text-xs text-[var(--muted-foreground)] lg:table-cell">
        {article.audience || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {article.status === ArticleStatus.PUBLISHED && (
            <a
              href={`/${article.fullSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Открыть на сайте"
              className="rounded-[var(--radius-btn)] p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
            </a>
          )}
          <Link
            href={`/admin/articles/${article.id}/edit`}
            title="Редактировать"
            className="rounded-[var(--radius-btn)] p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <button
            onClick={handleDelete}
            title="Удалить"
            className="rounded-[var(--radius-btn)] p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </td>
    </tr>
  )
}
