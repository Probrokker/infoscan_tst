'use server'

/**
 * Server action логина админки.
 *
 * - Rate-limit: 5 попыток на IP за 60s.
 * - Аудит: пишем LOGIN_SUCCESS / LOGIN_FAILURE.
 * - На успехе redirectTo: '/admin' — Auth.js сам редиректит.
 */
import { headers } from 'next/headers'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { signIn } from '@/auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { recordAudit, AuditAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export interface LoginState {
  error?: string
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = String(formData.get('email') ?? '')
  const rawPassword = String(formData.get('password') ?? '')

  const parsed = schema.safeParse({ email: rawEmail, password: rawPassword })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Неверные данные' }
  }

  const reqHeaders = await headers()
  const ip = getClientIp(reqHeaders)

  const limit = rateLimit(`login:${ip}`, { limit: 5, windowSec: 60 })
  if (!limit.ok) {
    return { error: `Слишком много попыток. Попробуйте через ${limit.retryAfterSec}с.` }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: '/admin',
    })
    return {}
  } catch (error) {
    // signIn() с redirectTo бросает NEXT_REDIRECT при успехе — это нормально,
    // его нужно пробросить дальше, чтобы Next выполнил редирект.
    if (
      error instanceof Error &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.startsWith('NEXT_REDIRECT')
    ) {
      // Параллельно пишем audit.success и обновляем lastLoginAt.
      const user = await prisma.user
        .findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true },
        })
        .catch(() => null)
      if (user) {
        await Promise.all([
          prisma.user
            .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
            .catch(() => null),
          recordAudit({
            action: AuditAction.LOGIN_SUCCESS,
            userId: user.id,
            entityType: 'User',
            entityId: user.id,
            ip,
          }),
        ])
      }
      throw error
    }

    if (error instanceof AuthError) {
      await recordAudit({
        action: AuditAction.LOGIN_FAILURE,
        entityType: 'User',
        ip,
        details: { email: parsed.data.email.toLowerCase() },
      })
      return { error: 'Неверный email или пароль' }
    }

    throw error
  }
}
