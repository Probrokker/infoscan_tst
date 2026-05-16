/**
 * Заглушка для логирования клиентских ошибок.
 * В dev — пишет в console.error. В prod при наличии Sentry DSN — отправляет в Sentry.
 * Sentry не подключён в зависимостях по умолчанию, чтобы не раздувать бандл.
 * Подключение делается отдельной командой по готовности продакшен-инфраструктуры.
 */
import { env } from '@/lib/env'

export interface CaptureContext {
  /** Имя компонента/фичи, где произошло. */
  scope?: string
  /** Дополнительные данные для трассировки. */
  extra?: Record<string, unknown>
}

export function captureError(error: unknown, context?: CaptureContext): void {
  if (env.NODE_ENV === 'production' && env.NEXT_PUBLIC_SENTRY_DSN) {
    // TODO от Кирилла: подключить Sentry/@sentry/nextjs, когда определится DSN.
    // import('@sentry/nextjs').then(({ captureException, withScope }) => {
    //   withScope((scope) => {
    //     if (context?.scope) scope.setTag('scope', context.scope)
    //     if (context?.extra) scope.setExtras(context.extra)
    //     captureException(error)
    //   })
    // })
    console.error('[observability]', context?.scope ?? 'unknown', error, context?.extra)
    return
  }
  console.error('[observability]', context?.scope ?? 'unknown', error, context?.extra)
}

export function captureMessage(message: string, context?: CaptureContext): void {
  if (env.NODE_ENV === 'production' && env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('[observability]', context?.scope ?? 'unknown', message, context?.extra)
    return
  }
  console.warn('[observability]', context?.scope ?? 'unknown', message, context?.extra)
}
