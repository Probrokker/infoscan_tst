import { describe, it, expect } from 'vitest'
import { cn, formatNumber, formatDate, pluralize, readingTime } from '@/lib/utils'

describe('cn', () => {
  it('объединяет классы', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('решает конфликты Tailwind', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
  it('игнорирует falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('formatNumber', () => {
  it('форматирует с пробелами разделителями', () => {
    // Intl.NumberFormat для ru-RU использует U+00A0 (nbsp) — это правильно.
    const result = formatNumber(1000000)
    expect(result.replace(/\s/g, ' ')).toMatch(/^1[\s ]000[\s ]000$/)
  })
})

describe('formatDate', () => {
  it('форматирует ISO в русский формат', () => {
    expect(formatDate('2026-05-15')).toContain('2026')
    expect(formatDate('2026-05-15')).toContain('мая')
  })
  it('возвращает исходную строку при невалидной дате', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('pluralize', () => {
  const forms: [string, string, string] = ['минута', 'минуты', 'минут']
  it('1 — единственное число', () => {
    expect(pluralize(1, forms)).toBe('минута')
    expect(pluralize(21, forms)).toBe('минута')
  })
  it('2-4 — двойственное', () => {
    expect(pluralize(2, forms)).toBe('минуты')
    expect(pluralize(3, forms)).toBe('минуты')
    expect(pluralize(4, forms)).toBe('минуты')
  })
  it('5-20 — множественное', () => {
    expect(pluralize(5, forms)).toBe('минут')
    expect(pluralize(11, forms)).toBe('минут')
    expect(pluralize(20, forms)).toBe('минут')
  })
})

describe('readingTime', () => {
  it('минимум 1 минута', () => {
    expect(readingTime('hello')).toBe(1)
  })
  it('200 слов = 1 минута', () => {
    const text = Array(200).fill('word').join(' ')
    expect(readingTime(text)).toBe(1)
  })
  it('400 слов = 2 минуты', () => {
    const text = Array(400).fill('word').join(' ')
    expect(readingTime(text)).toBe(2)
  })
})
