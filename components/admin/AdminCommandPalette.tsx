'use client'

/**
 * Cmd+K командная палитра для админки.
 * Использует cmdk — список быстрых переходов по страницам.
 * На шаге 8 добавим поиск статей в реальном времени через API.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FolderTree,
  Cpu,
  GitBranch,
  Users,
  ScrollText,
  Database,
  ExternalLink,
  HelpCircle,
  BookOpen,
} from 'lucide-react'

const COMMANDS: Array<{
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  group: string
}> = [
  { id: 'dashboard', label: 'Дашборд', href: '/admin', icon: LayoutDashboard, group: 'Навигация' },
  {
    id: 'articles',
    label: 'Все статьи',
    href: '/admin/articles',
    icon: FileText,
    group: 'Навигация',
  },
  {
    id: 'new-article',
    label: 'Новая статья',
    href: '/admin/articles/new',
    icon: FilePlus,
    group: 'Действия',
  },
  {
    id: 'sections',
    label: 'Разделы',
    href: '/admin/sections',
    icon: FolderTree,
    group: 'Навигация',
  },
  { id: 'devices', label: 'Справочники', href: '/admin/reference', icon: Cpu, group: 'Навигация' },
  {
    id: 'learning-paths',
    label: 'Учебные пути',
    href: '/admin/learning-paths',
    icon: BookOpen,
    group: 'Навигация',
  },
  { id: 'faq', label: 'FAQ', href: '/admin/faq', icon: HelpCircle, group: 'Навигация' },
  {
    id: 'git-sync',
    label: 'Sync to Git',
    href: '/admin/git-sync',
    icon: GitBranch,
    group: 'Навигация',
  },
  { id: 'users', label: 'Пользователи', href: '/admin/users', icon: Users, group: 'Навигация' },
  { id: 'audit', label: 'Аудит', href: '/admin/audit', icon: ScrollText, group: 'Навигация' },
  { id: 'backups', label: 'Бэкапы', href: '/admin/backups', icon: Database, group: 'Навигация' },
  { id: 'site', label: 'Открыть сайт', href: '/', icon: ExternalLink, group: 'Действия' },
]

export function AdminCommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  function runCommand(href: string) {
    setOpen(false)
    if (href === '/') {
      window.open('/', '_blank')
      return
    }
    router.push(href)
  }

  // Группируем команды
  const groups = [...new Set(COMMANDS.map((c) => c.group))]

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        aria-label="Закрыть командную палитру"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-card)] border bg-[var(--background)] shadow-2xl">
        <Command label="Командная палитра">
          <div className="flex items-center border-b px-3">
            <Command.Input
              placeholder="Поиск команд..."
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <kbd className="hidden rounded border px-1.5 py-0.5 text-xs text-[var(--muted-foreground)] sm:block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              Ничего не найдено.
            </Command.Empty>

            {groups.map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--muted-foreground)] [&_[cmdk-group-heading]]:uppercase"
              >
                {COMMANDS.filter((c) => c.group === group).map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => runCommand(cmd.href)}
                      className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-btn)] px-2 py-2 text-sm aria-selected:bg-[var(--accent)]"
                    >
                      <Icon className="h-4 w-4 text-[var(--muted-foreground)]" strokeWidth={1.5} />
                      {cmd.label}
                    </Command.Item>
                  )
                })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-[var(--muted-foreground)]">
            <kbd className="rounded border px-1 py-0.5">↑↓</kbd> навигация
            {'  '}
            <kbd className="rounded border px-1 py-0.5">↵</kbd> выбрать
            {'  '}
            <kbd className="rounded border px-1 py-0.5">ESC</kbd> закрыть
          </div>
        </Command>
      </div>
    </div>
  )
}
