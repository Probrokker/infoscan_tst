/**
 * Обёртка админ-панели: шапка с логотипом и пользователем, левый сайдбар
 * со ссылками на разделы (на шаге 5 наполним), футер пустой.
 *
 * Серверный компонент. Внутрь могут вкладываться клиентские компоненты
 * (например, командная палитра на шаге 5).
 */
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Cpu,
  GitBranch,
  Users,
  ScrollText,
  Database,
} from 'lucide-react'
import type { Session } from 'next-auth'
import { LogoutButton } from '@/components/admin/LogoutButton'

interface AdminShellProps {
  user: NonNullable<Session['user']>
  children: React.ReactNode
}

const NAV_ITEMS: Array<{
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>
  adminOnly?: boolean
}> = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/articles', label: 'Статьи', icon: FileText },
  { href: '/admin/sections', label: 'Разделы', icon: FolderTree },
  { href: '/admin/devices', label: 'Устройства', icon: Cpu },
  { href: '/admin/git-sync', label: 'Sync to Git', icon: GitBranch },
  { href: '/admin/users', label: 'Пользователи', icon: Users, adminOnly: true },
  { href: '/admin/audit', label: 'Аудит', icon: ScrollText, adminOnly: true },
  { href: '/admin/backups', label: 'Бэкапы', icon: Database, adminOnly: true },
]

export function AdminShell({ user, children }: AdminShellProps) {
  const isAdmin = user.role === 'ADMIN'

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-[var(--background)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-semibold tracking-tight">
            Админ Инфоскан
          </Link>
          <Link
            href="/"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ← Открыть сайт
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden text-right sm:block">
            <div className="leading-tight font-medium">{user.name ?? user.email}</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {user.role === 'ADMIN' ? 'Администратор' : 'Редактор'}
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          aria-label="Навигация админки"
          className="hidden w-56 shrink-0 border-r bg-[var(--background)] p-4 sm:block"
        >
          <nav>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
