/**
 * Валидация переменных окружения на старте через Zod.
 * Если NEXT_PUBLIC_* переменная не задана или не подходит — приложение
 * падает на билде с понятной ошибкой, а не в рантайме у клиента.
 */
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_SITE_URL должен быть валидным URL' })
    .default('http://localhost:3000'),
  NEXT_PUBLIC_ANALYTICS: z.enum(['on', 'off']).default('off'),
  NEXT_PUBLIC_ANALYTICS_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse({
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
    throw new Error(`Невалидные переменные окружения:\n${message}`)
  }

  return parsed.data
}

export const env = loadEnv()
