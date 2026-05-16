/**
 * Валидация переменных окружения через Zod.
 *
 * Делим на две схемы:
 *   - publicEnv — NEXT_PUBLIC_* (используются и на клиенте, и на сервере),
 *   - serverEnv — серверные секреты (DATABASE_URL, NEXTAUTH_SECRET и т.п.),
 *     которые валидируются ТОЛЬКО на сервере. На клиенте serverEnv недоступен.
 *
 * Если переменная не задана или не подходит — приложение падает на старте
 * с понятной ошибкой, а не в рантайме у клиента.
 */
import { z } from 'zod'

// ---- Публичная схема (клиент + сервер) ----
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_SITE_URL должен быть валидным URL' })
    .default('http://localhost:3000'),
  NEXT_PUBLIC_ANALYTICS: z.enum(['on', 'off']).default('off'),
  NEXT_PUBLIC_ANALYTICS_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

function loadPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'],
    NEXT_PUBLIC_ANALYTICS: process.env['NEXT_PUBLIC_ANALYTICS'],
    NEXT_PUBLIC_ANALYTICS_DOMAIN: process.env['NEXT_PUBLIC_ANALYTICS_DOMAIN'],
    NEXT_PUBLIC_SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'],
    NODE_ENV: process.env['NODE_ENV'],
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  • ${key}: ${msgs?.join(', ')}`)
      .join('\n')
    throw new Error(`Невалидные публичные переменные окружения:\n${message}`)
  }

  return parsed.data
}

export const env = loadPublicEnv()

// ---- Серверная схема (только сервер) ----
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен (Postgres)'),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET минимум 32 символа'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),
  GIT_REPO_URL: z.string().min(1).optional(),
  GIT_BRANCH: z.string().min(1).default('main'),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let serverEnvCache: ServerEnv | undefined

/**
 * Получить серверные переменные. Бросает на клиенте.
 *
 * DATABASE_URL и NEXTAUTH_SECRET — обязательны (используются Prisma и Auth.js).
 * Остальные опциональны — сценарии (git sync, начальный admin) работают без них.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() нельзя вызывать на клиенте')
  }
  if (serverEnvCache) return serverEnvCache

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env['DATABASE_URL'],
    NEXTAUTH_URL: process.env['NEXTAUTH_URL'],
    NEXTAUTH_SECRET: process.env['NEXTAUTH_SECRET'],
    ADMIN_EMAIL: process.env['ADMIN_EMAIL'],
    ADMIN_PASSWORD: process.env['ADMIN_PASSWORD'],
    GIT_REPO_URL: process.env['GIT_REPO_URL'],
    GIT_BRANCH: process.env['GIT_BRANCH'],
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const message = Object.entries(errors)
      .map(([key, msgs]) => `  • ${key}: ${msgs?.join(', ')}`)
      .join('\n')
    throw new Error(`Невалидные серверные переменные окружения:\n${message}`)
  }

  serverEnvCache = parsed.data
  return serverEnvCache
}
