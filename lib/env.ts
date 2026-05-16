/**
 * Простой доступ к env-переменным. Без Zod-валидации на этапе билда —
 * это спасает от ошибок при статическом экспорте. Если переменная
 * не задана, используется fallback.
 */
export const env = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  NEXT_PUBLIC_ANALYTICS: (process.env.NEXT_PUBLIC_ANALYTICS as 'on' | 'off') || 'off',
  NEXT_PUBLIC_ANALYTICS_DOMAIN: process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || '',
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
}
