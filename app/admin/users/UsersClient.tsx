'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Check, X, KeyRound, UserMinus, UserCheck, Eye, EyeOff, Plus } from 'lucide-react'
import { Role } from '@prisma/client'
import {
  createUserAction,
  updateUserAction,
  changePasswordAction,
  deactivateUserAction,
  restoreUserAction,
} from './actions'

interface UserRow {
  id: string
  email: string
  name: string
  role: Role
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  _count: { articles: number }
}

interface UsersClientProps {
  users: UserRow[]
  currentUserId: string
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Администратор',
  EDITOR: 'Редактор',
}

export function UsersClient({ users: initial, currentUserId }: UsersClientProps) {
  const router = useRouter()
  const [users, setUsers] = React.useState(initial)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editRole, setEditRole] = React.useState<Role>(Role.EDITOR)

  const [pwdUserId, setPwdUserId] = React.useState<string | null>(null)
  const [newPassword, setNewPassword] = React.useState('')
  const [showPwd, setShowPwd] = React.useState(false)

  const [showAdd, setShowAdd] = React.useState(false)
  const [newEmail, setNewEmail] = React.useState('')
  const [newName, setNewName] = React.useState('')
  const [newPwd, setNewPwd] = React.useState('')
  const [newRole, setNewRole] = React.useState<Role>(Role.EDITOR)
  const [showNewPwd, setShowNewPwd] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  function startEdit(u: UserRow) {
    setEditingId(u.id)
    setEditName(u.name)
    setEditRole(u.role)
    setPwdUserId(null)
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const fd = new FormData()
    fd.append('name', editName)
    fd.append('role', editRole)
    const result = await updateUserAction(id, fd)
    setSaving(false)
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, name: editName, role: editRole } : u)),
      )
      setEditingId(null)
      toast.success('Пользователь сохранён')
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function savePwd(id: string) {
    if (newPassword.length < 8) {
      toast.error('Минимум 8 символов')
      return
    }
    setSaving(true)
    const fd = new FormData()
    fd.append('password', newPassword)
    const result = await changePasswordAction(id, fd)
    setSaving(false)
    if (result.ok) {
      setPwdUserId(null)
      setNewPassword('')
      toast.success('Пароль изменён')
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  function handleDeactivate(id: string, name: string) {
    // Показываем toast с кнопкой «Отмена» (undo)
    const tid = toast.loading(`Деактивируем «${name}»…`)
    let undone = false

    const undoTimer = setTimeout(async () => {
      if (undone) return
      const result = await deactivateUserAction(id)
      if (result.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)))
        toast.success(`«${name}» деактивирован`, { id: tid })
      } else {
        toast.error(result.error ?? 'Ошибка', { id: tid })
      }
    }, 4000)

    toast(`Деактивировать «${name}»?`, {
      id: tid,
      action: {
        label: 'Отмена',
        onClick: () => {
          undone = true
          clearTimeout(undoTimer)
          toast.dismiss(tid)
        },
      },
      duration: 4000,
    })
  }

  async function handleRestore(id: string, name: string) {
    const result = await restoreUserAction(id)
    if (result.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: true } : u)))
      toast.success(`«${name}» восстановлен`)
    } else {
      toast.error(result.error ?? 'Ошибка')
    }
  }

  async function handleCreate() {
    if (!newEmail || !newName || !newPwd) return
    setSaving(true)
    const fd = new FormData()
    fd.append('email', newEmail)
    fd.append('name', newName)
    fd.append('password', newPwd)
    fd.append('role', newRole)
    const result = await createUserAction(fd)
    setSaving(false)
    if (result.ok) {
      toast.success('Пользователь создан')
      setShowAdd(false)
      setNewEmail('')
      setNewName('')
      setNewPwd('')
      setNewRole(Role.EDITOR)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Ошибка создания')
    }
  }

  return (
    <div className="space-y-2">
      {/* Список */}
      {users.map((user) => (
        <div key={user.id} className="rounded-[var(--radius-card)] border bg-[var(--background)]">
          {/* Основная строка */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            {/* Аватар-инициалы */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {editingId === user.id ? (
              <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center">
                <input
                  id={`edit-name-${user.id}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Имя"
                  className="flex-1 rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveEdit(user.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
                <select
                  id={`edit-role-${user.id}`}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                >
                  {Object.values(Role).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void saveEdit(user.id)}
                    disabled={saving}
                    className="rounded p-1.5 text-[var(--color-success)] hover:bg-[var(--accent)]"
                    title="Сохранить"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                    title="Отмена"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      user.role === Role.ADMIN
                        ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {ROLE_LABEL[user.role]}
                  </span>
                  {!user.isActive && (
                    <span className="rounded-full bg-[var(--color-error)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-error)]">
                      Неактивен
                    </span>
                  )}
                  {user.id === currentUserId && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      Вы
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{user.email}</span>
              </div>
            )}

            <div className="mr-auto flex shrink-0 items-center gap-1 text-xs text-[var(--muted-foreground)]">
              {user.lastLoginAt
                ? `Вход: ${new Date(user.lastLoginAt).toLocaleDateString('ru-RU')}`
                : 'Не входил'}
              <span className="ml-2">{user._count.articles} ст.</span>
            </div>

            {/* Действия */}
            {editingId !== user.id && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  title="Редактировать"
                  className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwdUserId(pwdUserId === user.id ? null : user.id)
                    setNewPassword('')
                  }}
                  title="Сменить пароль"
                  className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                >
                  <KeyRound className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                </button>
                {user.id !== currentUserId &&
                  (user.isActive ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(user.id, user.name)}
                      title="Деактивировать"
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                    >
                      <UserMinus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRestore(user.id, user.name)}
                      title="Восстановить"
                      className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--color-success)]/10 hover:text-[var(--color-success)]"
                    >
                      <UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Смена пароля */}
          {pwdUserId === user.id && (
            <div className="flex items-center gap-2 border-t px-4 py-2">
              <div className="relative max-w-xs flex-1">
                <input
                  id={`new-pwd-${user.id}`}
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Новый пароль (мин. 8 символов)"
                  className="w-full rounded border bg-[var(--muted)] px-2 py-1.5 pr-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void savePwd(user.id)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  title={showPwd ? 'Скрыть' : 'Показать'}
                >
                  {showPwd ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void savePwd(user.id)}
                disabled={saving || newPassword.length < 8}
                className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setPwdUserId(null)
                  setNewPassword('')
                }}
                className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Добавить пользователя */}
      {showAdd ? (
        <div className="space-y-2 rounded-[var(--radius-card)] border border-dashed p-4">
          <h3 className="text-sm font-semibold">Новый пользователь</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-user-name"
                className="mb-0.5 block text-xs text-[var(--muted-foreground)]"
              >
                Имя *
              </label>
              <input
                id="new-user-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="new-user-email"
                className="mb-0.5 block text-xs text-[var(--muted-foreground)]"
              >
                Email *
              </label>
              <input
                id="new-user-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="new-user-pwd"
                className="mb-0.5 block text-xs text-[var(--muted-foreground)]"
              >
                Пароль * (мин. 8)
              </label>
              <div className="relative">
                <input
                  id="new-user-pwd"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border bg-[var(--muted)] px-2 py-1.5 pr-8 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--muted-foreground)]"
                >
                  {showNewPwd ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="new-user-role"
                className="mb-0.5 block text-xs text-[var(--muted-foreground)]"
              >
                Роль
              </label>
              <select
                id="new-user-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="w-full rounded border bg-[var(--muted)] px-2 py-1.5 text-sm"
              >
                {Object.values(Role).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={saving || !newEmail || !newName || newPwd.length < 8}
              className="rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Создать
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false)
                setNewEmail('')
                setNewName('')
                setNewPwd('')
              }}
              className="rounded-[var(--radius-btn)] border px-4 py-1.5 text-sm hover:bg-[var(--accent)]"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-card)] border border-dashed px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Добавить пользователя
        </button>
      )}
    </div>
  )
}
