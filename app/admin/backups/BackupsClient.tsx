'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Download, Trash2, RotateCcw, HardDrive, AlertTriangle } from 'lucide-react'
import {
  createBackupAction,
  restoreBackupAction,
  deleteBackupAction,
  getBackupsAction,
  type BackupFile,
} from './actions'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BackupsClient({ initialBackups }: { initialBackups: BackupFile[] }) {
  const [backups, setBackups] = React.useState(initialBackups)
  const [creating, setCreating] = React.useState(false)
  const [confirmRestore, setConfirmRestore] = React.useState<string | null>(null)
  const [restoring, setRestoring] = React.useState(false)

  async function handleCreate() {
    setCreating(true)
    const tid = toast.loading('Создаю резервную копию…')
    const result = await createBackupAction()
    setCreating(false)
    if (result.ok) {
      toast.success(`Бэкап создан: ${result.filename}`, { id: tid })
      setBackups(await getBackupsAction())
    } else {
      toast.error(result.error ?? 'Ошибка', { id: tid })
    }
  }

  async function handleDelete(filename: string) {
    const result = await deleteBackupAction(filename)
    if (result.ok) {
      setBackups((prev) => prev.filter((b) => b.filename !== filename))
      toast.success('Бэкап удалён')
    } else {
      toast.error(result.error ?? 'Ошибка удаления')
    }
  }

  async function handleRestore(filename: string) {
    setRestoring(true)
    setConfirmRestore(null)
    const tid = toast.loading('Восстанавливаю базу данных…')
    const result = await restoreBackupAction(filename)
    setRestoring(false)
    if (result.ok) {
      toast.success('База данных восстановлена. Рекомендуем перезапустить приложение.', {
        id: tid,
        duration: 8000,
      })
    } else {
      toast.error(result.error ?? 'Ошибка восстановления', { id: tid })
    }
  }

  return (
    <div className="space-y-6">
      {/* Создать бэкап */}
      <div className="rounded-[var(--radius-card)] border p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]">
            <HardDrive
              className="h-5 w-5 text-[var(--muted-foreground)]"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Резервное копирование</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Создаёт полный снимок базы данных PostgreSQL (pg_dump custom format). Файлы хранятся в
              директории{' '}
              <code className="rounded bg-[var(--muted)] px-1 font-mono text-xs">backups/</code> на
              сервере.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Создаю…' : 'Создать бэкап'}
          </button>
        </div>
      </div>

      {/* Список бэкапов */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">
          Файлы бэкапов
          <span className="ml-2 font-normal text-[var(--muted-foreground)]">
            ({backups.length})
          </span>
        </h2>

        {backups.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Бэкапов пока нет.</p>
        ) : (
          <div className="space-y-1">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border bg-[var(--background)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{backup.filename}</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {formatBytes(backup.sizeBytes)} ·{' '}
                    {new Date(backup.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={`/api/admin/backup/${encodeURIComponent(backup.filename)}`}
                    download
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    title="Скачать"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </a>
                  <button
                    type="button"
                    onClick={() => setConfirmRestore(backup.filename)}
                    disabled={restoring}
                    title="Восстановить БД из этого бэкапа"
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-warning)]/10 hover:text-amber-600 disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(backup.filename)}
                    title="Удалить бэкап"
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Диалог подтверждения восстановления */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border bg-[var(--background)] p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-6 w-6 shrink-0 text-amber-500"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <h3 className="font-semibold">Восстановить базу данных?</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Это <strong>перезапишет все текущие данные</strong> содержимым бэкапа:
                </p>
                <p className="mt-2 font-mono text-sm">{confirmRestore}</p>
                <p className="mt-2 text-sm text-[var(--color-error)]">
                  Действие необратимо. Рекомендуем сначала создать свежий бэкап.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestore(null)}
                className="rounded-[var(--radius-btn)] border px-4 py-2 text-sm hover:bg-[var(--accent)]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleRestore(confirmRestore)}
                className="rounded-[var(--radius-btn)] bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Восстановить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
