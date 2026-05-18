import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { TemplatesClient } from './TemplatesClient'

export const metadata = { title: 'Шаблоны JS — Инфоскан Admin' }
export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const templates = await prisma.jsTemplate.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      version: true,
      isActive: true,
      order: true,
      description: true,
      compatibleWith: true,
      _count: { select: { configs: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Link href="/admin/js-constructor" className="hover:text-[var(--foreground)]">
              Конструктор JS
            </Link>
            <span>/</span>
            <span>Библиотека шаблонов</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">Библиотека шаблонов</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Базовые JS-шаблоны с плейсхолдерами. Используются в конструкторе конфигураций.
          </p>
        </div>
        <Link
          href="/admin/js-constructor/templates/new"
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Новый шаблон
        </Link>
      </div>

      <TemplatesClient templates={templates} />
    </div>
  )
}
