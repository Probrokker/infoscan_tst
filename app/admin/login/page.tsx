/**
 * Страница входа в админ-панель: /admin/login.
 *
 * Форма — клиентский компонент с useFormState; server action loginAction
 * выполняет проверку учётных данных и редирект на /admin.
 */
import type { Metadata } from 'next'
import { LoginForm } from './form'

export const metadata: Metadata = {
  title: 'Вход в админ-панель',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-[var(--radius-card)] border bg-[var(--card)] p-8 shadow-sm">
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Админ-панель</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Войдите, чтобы управлять контентом базы знаний Инфоскан.
            </p>
          </header>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
