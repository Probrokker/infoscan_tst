'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertCircle, LogIn } from 'lucide-react'
import { loginAction, type LoginState } from './actions'

const INITIAL_STATE: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-yellow-brand)] px-4 py-2.5 text-sm font-semibold text-[var(--color-black-brand)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden />
      {pending ? 'Проверяем...' : 'Войти'}
    </button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_STATE)

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          className="w-full rounded-[var(--radius-input)] border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-yellow-brand)]"
        />
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-card)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-3 text-sm text-[var(--color-error)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  )
}
