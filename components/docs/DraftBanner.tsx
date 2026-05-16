/**
 * Плашка «Черновик — на проверке». Показывается, если frontmatter.status === 'draft'.
 */
import { AlertTriangle } from 'lucide-react'

export function DraftBanner() {
  return (
    <div
      role="alert"
      className="mb-6 flex items-center gap-3 rounded-[var(--radius-card)] border-l-4 border-[var(--color-warning)] bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
      <div className="text-sm">
        <strong>Черновик.</strong> Эта статья в работе — данные могут поменяться.
      </div>
    </div>
  )
}
