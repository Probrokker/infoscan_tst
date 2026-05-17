'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { AuditAction } from '@prisma/client'

interface LogEntry {
  id: string
  action: AuditAction
  entityType: string
  entityId: string | null
  ip: string | null
  createdAt: string
  details: string | null
  userName: string | null
  userEmail: string | null
}

interface AuditClientProps {
  logs: LogEntry[]
  users: { id: string; name: string }[]
  total: number
  page: number
  pageSize: number
  filterAction: string
  filterEntityType: string
  filterUserId: string
}

const ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  [AuditAction.LOGIN_SUCCESS]: 'Вход',
  [AuditAction.LOGIN_FAILURE]: 'Ошибка входа',
  [AuditAction.LOGOUT]: 'Выход',
  [AuditAction.PASSWORD_CHANGE]: 'Смена пароля',
  [AuditAction.CREATE]: 'Создание',
  [AuditAction.UPDATE]: 'Изменение',
  [AuditAction.DELETE]: 'Удаление',
  [AuditAction.PUBLISH]: 'Публикация',
  [AuditAction.ARCHIVE]: 'Архив',
  [AuditAction.GIT_SYNC]: 'Git sync',
  [AuditAction.USER_CREATE]: 'Создан пользователь',
  [AuditAction.USER_UPDATE]: 'Изменён пользователь',
  [AuditAction.USER_DEACTIVATE]: 'Деактивация',
}

const ACTION_COLOR: Partial<Record<AuditAction, string>> = {
  [AuditAction.LOGIN_FAILURE]: 'text-[var(--color-error)]',
  [AuditAction.DELETE]: 'text-[var(--color-error)]',
  [AuditAction.USER_DEACTIVATE]: 'text-[var(--color-error)]',
  [AuditAction.CREATE]: 'text-[var(--color-success)]',
  [AuditAction.USER_CREATE]: 'text-[var(--color-success)]',
  [AuditAction.PUBLISH]: 'text-[var(--color-brand)]',
  [AuditAction.LOGIN_SUCCESS]: 'text-[var(--color-success)]',
}

export function AuditClient({
  logs,
  users,
  total,
  page,
  pageSize,
  filterAction,
  filterEntityType,
  filterUserId,
}: AuditClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = React.useState<string | null>(null)

  function applyFilter(params: Record<string, string>) {
    const sp = new URLSearchParams()
    sp.set('page', '1')
    if (filterAction && !('action' in params)) sp.set('action', filterAction)
    if (filterEntityType && !('entityType' in params)) sp.set('entityType', filterEntityType)
    if (filterUserId && !('userId' in params)) sp.set('userId', filterUserId)
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    router.push(`${pathname}?${sp.toString()}`)
  }

  function goPage(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (filterAction) sp.set('action', filterAction)
    if (filterEntityType) sp.set('entityType', filterEntityType)
    if (filterUserId) sp.set('userId', filterUserId)
    router.push(`${pathname}?${sp.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)
  const entityTypes = [...new Set(logs.map((l) => l.entityType))]

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border bg-[var(--muted)] px-3 py-2">
        <Filter
          className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
          strokeWidth={1.5}
          aria-hidden
        />
        <select
          id="audit-filter-action"
          value={filterAction}
          onChange={(e) => applyFilter({ action: e.target.value })}
          className="rounded border bg-[var(--background)] px-2 py-1 text-sm"
        >
          <option value="">Все действия</option>
          {Object.entries(AuditAction).map(([k]) => (
            <option key={k} value={k}>
              {ACTION_LABELS[k as AuditAction] ?? k}
            </option>
          ))}
        </select>
        <select
          id="audit-filter-entity"
          value={filterEntityType}
          onChange={(e) => applyFilter({ entityType: e.target.value })}
          className="rounded border bg-[var(--background)] px-2 py-1 text-sm"
        >
          <option value="">Все типы</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          {['Article', 'Section', 'User', 'FaqItem', 'LearningPath']
            .filter((t) => !entityTypes.includes(t))
            .map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
        </select>
        <select
          id="audit-filter-user"
          value={filterUserId}
          onChange={(e) => applyFilter({ userId: e.target.value })}
          className="rounded border bg-[var(--background)] px-2 py-1 text-sm"
        >
          <option value="">Все пользователи</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {(filterAction || filterEntityType || filterUserId) && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
          >
            Сбросить
          </button>
        )}
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{total} записей</span>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-xs text-[var(--muted-foreground)]">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Время</th>
              <th className="px-3 py-2 text-left font-medium">Действие</th>
              <th className="px-3 py-2 text-left font-medium">Тип / ID</th>
              <th className="px-3 py-2 text-left font-medium">Пользователь</th>
              <th className="px-3 py-2 text-left font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <React.Fragment key={log.id}>
                <tr
                  className="cursor-pointer hover:bg-[var(--muted)]/50"
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-[var(--muted-foreground)]">
                    {new Date(log.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className={`px-3 py-2 font-medium ${ACTION_COLOR[log.action] ?? ''}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{log.entityType}</span>
                    {log.entityId && (
                      <span className="ml-1 font-mono text-xs text-[var(--muted-foreground)]">
                        {log.entityId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {log.userName ?? (
                      <span className="text-[var(--muted-foreground)] italic">система</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                    {log.ip ?? '—'}
                  </td>
                </tr>
                {expanded === log.id && log.details && (
                  <tr className="bg-[var(--muted)]/30">
                    <td colSpan={5} className="px-4 py-2">
                      <pre className="overflow-x-auto text-xs text-[var(--muted-foreground)]">
                        {JSON.stringify(JSON.parse(log.details) as unknown, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  Записей не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">
            Страница {page} из {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-[var(--radius-btn)] border px-3 py-1.5 hover:bg-[var(--accent)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Назад
            </button>
            <button
              type="button"
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-[var(--radius-btn)] border px-3 py-1.5 hover:bg-[var(--accent)] disabled:opacity-40"
            >
              Вперёд <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
