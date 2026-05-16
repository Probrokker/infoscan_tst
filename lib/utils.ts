/**
 * Утилиты общего назначения.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Безопасно объединяет classNames с учётом приоритета Tailwind.
 * Используется во всех shadcn-компонентах.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует число с разделителем тысяч в русской локали.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/**
 * Форматирует дату ISO в человекочитаемый русский формат: «15 мая 2026».
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Возвращает корректное склонение существительного по числу.
 * Пример: pluralize(5, ['минута', 'минуты', 'минут']) → 'минут'.
 */
export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (lastDigit > 1 && lastDigit < 5) return forms[1]
  if (lastDigit === 1) return forms[0]
  return forms[2]
}

/**
 * Расчёт времени чтения по числу слов.
 * Скорость — 200 слов в минуту (стандарт для технического текста).
 */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}
