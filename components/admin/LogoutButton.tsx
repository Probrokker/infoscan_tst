/**
 * Кнопка «Выйти» — оборачивает server action signOut(), пишет audit и редиректит
 * на /admin/login. Использует form для no-JS совместимости.
 */
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/admin/actions'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        title="Выйти из админ-панели"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Выйти
      </button>
    </form>
  )
}
