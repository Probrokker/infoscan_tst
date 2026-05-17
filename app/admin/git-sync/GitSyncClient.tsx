'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { GitBranch, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { triggerGitSyncAction, getGitSyncRunsAction, type SyncRunRow } from './actions'

interface GitSyncClientProps {
  initialRuns: SyncRunRow[]
  repoUrl: string
  branch: string
}

export function GitSyncClient({ initialRuns, repoUrl, branch }: GitSyncClientProps) {
  const [runs, setRuns] = React.useState(initialRuns)
  const [syncing, setSyncing] = React.useState(false)

  async function handleSync() {
    setSyncing(true)
    const tid = toast.loading('Синхронизирую с Git…')
    const result = await triggerGitSyncAction()
    setSyncing(false)

    if (result.ok) {
      if (result.filesChanged === 0) {
        toast.success('Нет изменений — репозиторий уже актуален', { id: tid })
      } else {
        toast.success(`Готово! ${result.filesChanged} файлов · commit ${result.commitSha ?? ''}`, {
          id: tid,
        })
      }
      // Обновляем историю
      const fresh = await getGitSyncRunsAction()
      setRuns(fresh)
    } else {
      toast.error(result.errorText ?? 'Ошибка синхронизации', { id: tid })
      const fresh = await getGitSyncRunsAction()
      setRuns(fresh)
    }
  }

  return (
    <div className="space-y-6">
      {/* Панель запуска */}
      <div className="rounded-[var(--radius-card)] border p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]">
            <GitBranch
              className="h-5 w-5 text-[var(--muted-foreground)]"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Экспорт в Git</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Экспортирует все опубликованные статьи и справочные данные в MDX/JSON-файлы и делает
              commit + push в репозиторий.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
              <span>
                Репозиторий:{' '}
                <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono">
                  {repoUrl || '(не задан — см. GIT_REPO_URL)'}
                </code>
              </span>
              <span>
                Ветка:{' '}
                <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono">{branch}</code>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || !repoUrl}
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
              strokeWidth={1.5}
              aria-hidden
            />
            {syncing ? 'Синхронизирую…' : 'Sync to Git'}
          </button>
        </div>
      </div>

      {/* История запусков */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">История запусков</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Синхронизаций ещё не было.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Время</th>
                  <th className="px-3 py-2 text-left font-medium">Статус</th>
                  <th className="px-3 py-2 text-left font-medium">Commit</th>
                  <th className="px-3 py-2 text-left font-medium">Файлов</th>
                  <th className="px-3 py-2 text-left font-medium">Время</th>
                  <th className="px-3 py-2 text-left font-medium">Кто</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-[var(--muted)]/40">
                    <td className="px-3 py-2 whitespace-nowrap text-[var(--muted-foreground)]">
                      {new Date(run.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {run.status === 'success' ? (
                        <span className="flex items-center gap-1 text-[var(--color-success)]">
                          <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                          {run.message === 'Нет изменений' ? 'Без изменений' : 'OK'}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-[var(--color-error)]"
                          title={run.errorText ?? ''}
                        >
                          <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                          Ошибка
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                      {run.commitSha ?? '—'}
                    </td>
                    <td className="px-3 py-2">{run.filesChanged}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                        {(run.durationMs / 1000).toFixed(1)}s
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">
                      {run.triggeredByName ?? 'авто'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ошибки последнего запуска */}
      {runs[0]?.status === 'failure' && runs[0].errorText && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3">
          <p className="mb-1 text-xs font-semibold text-[var(--color-error)]">
            Ошибка последнего запуска:
          </p>
          <pre className="overflow-x-auto text-xs text-[var(--color-error)]/80">
            {runs[0].errorText}
          </pre>
        </div>
      )}
    </div>
  )
}
