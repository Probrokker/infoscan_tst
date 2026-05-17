/**
 * Простой in-memory rate-limiter с фиксированным окном.
 *
 * Достаточен для одной ноды Next-сервера (наш кейс — один контейнер app).
 * Если на следующих этапах понадобится горизонтальное масштабирование,
 * заменим на Redis/Upstash.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

export function rateLimit(
  key: string,
  options: { limit: number; windowSec: number },
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSec * 1000
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: options.limit - 1, retryAfterSec: 0 }
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return {
    ok: true,
    remaining: options.limit - bucket.count,
    retryAfterSec: 0,
  }
}

/**
 * Извлекает IP клиента из заголовков запроса (за nginx-прокси / в локальной разработке).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return headers.get('x-real-ip') ?? 'unknown'
}
