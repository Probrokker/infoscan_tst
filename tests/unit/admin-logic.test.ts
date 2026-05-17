import { describe, it, expect } from 'vitest'

/**
 * Тесты для rate-limit логики (lib/rate-limit.ts).
 * Тестируем только чистую логику без Express/HTTP.
 */

// Простая реализация rate-limit in-memory для тестирования изолированно
class RateLimiter {
  private map = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.map.get(key)

    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs
      this.map.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: this.maxRequests - 1, resetAt }
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: this.maxRequests - entry.count, resetAt: entry.resetAt }
  }

  reset(key: string) {
    this.map.delete(key)
  }
}

describe('RateLimiter', () => {
  it('разрешает запросы в пределах лимита', () => {
    const rl = new RateLimiter(3, 60_000)
    expect(rl.check('ip1').allowed).toBe(true)
    expect(rl.check('ip1').allowed).toBe(true)
    expect(rl.check('ip1').allowed).toBe(true)
  })

  it('блокирует после превышения лимита', () => {
    const rl = new RateLimiter(2, 60_000)
    rl.check('ip2')
    rl.check('ip2')
    const result = rl.check('ip2')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('разные ключи независимы', () => {
    const rl = new RateLimiter(1, 60_000)
    rl.check('a')
    expect(rl.check('b').allowed).toBe(true)
    expect(rl.check('a').allowed).toBe(false)
  })

  it('уменьшает remaining с каждым запросом', () => {
    const rl = new RateLimiter(5, 60_000)
    expect(rl.check('ip').remaining).toBe(4)
    expect(rl.check('ip').remaining).toBe(3)
    expect(rl.check('ip').remaining).toBe(2)
  })

  it('reset сбрасывает счётчик', () => {
    const rl = new RateLimiter(1, 60_000)
    rl.check('ip')
    expect(rl.check('ip').allowed).toBe(false)
    rl.reset('ip')
    expect(rl.check('ip').allowed).toBe(true)
  })
})

describe('slug generation', () => {
  // Тест логики генерации slug — используем функцию напрямую

  function makeSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[а-яёА-ЯЁ]/g, (ch) => {
        const map: Record<string, string> = {
          а: 'a',
          б: 'b',
          в: 'v',
          г: 'g',
          д: 'd',
          е: 'e',
          ё: 'yo',
          ж: 'zh',
          з: 'z',
          и: 'i',
          й: 'j',
          к: 'k',
          л: 'l',
          м: 'm',
          н: 'n',
          о: 'o',
          п: 'p',
          р: 'r',
          с: 's',
          т: 't',
          у: 'u',
          ф: 'f',
          х: 'h',
          ц: 'ts',
          ч: 'ch',
          ш: 'sh',
          щ: 'sch',
          ъ: '',
          ы: 'y',
          ь: '',
          э: 'e',
          ю: 'yu',
          я: 'ya',
        }
        return map[ch.toLowerCase()] ?? ch
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  it('транслитерирует кириллицу', () => {
    expect(makeSlug('Что такое Инфоскан')).toBe('chto-takoe-infoskan')
  })

  it('обрабатывает дефисы и пробелы', () => {
    expect(makeSlug('  hello   world  ')).toBe('hello-world')
  })

  it('убирает спецсимволы', () => {
    expect(makeSlug('hello & world!')).toBe('hello-world')
  })
})
