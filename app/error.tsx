'use client'

/**
 * Глобальный Error Boundary App Router.
 * Срабатывает на необработанные ошибки в любой клиентской ветке.
 */
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { captureError } from '@/lib/observability'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    captureError(error, { scope: 'app/error.tsx', extra: { digest: error.digest } })
  }, [error])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Сбой при загрузке страницы. Попробуйте обновить или вернуться на главную.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-[var(--muted-foreground)]">
          ID ошибки: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Повторить попытку</Button>
        <Button variant="outline" asChild>
          <a href="/">На главную</a>
        </Button>
      </div>
    </div>
  )
}
