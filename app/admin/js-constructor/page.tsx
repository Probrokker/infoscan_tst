import Link from 'next/link'
import { Plus, Code2, Library } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ConfigsClient } from './ConfigsClient'

export const metadata = { title: 'Конструктор JS — Инфоскан Admin' }
export const dynamic = 'force-dynamic'

export default async function JsConstructorPage() {
  const [configs, templateCount] = await Promise.all([
    prisma.jsConfig.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        clientName: true,
        templateIds: true,
        updatedAt: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.jsTemplate.count({ where: { isActive: true } }),
  ])

  const serialized = configs.map((c) => ({
    ...c,
    updatedAt: c.updatedAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    authorName: c.createdBy?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Конструктор JS-шаблона</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Собирай интеграционные скрипты из шаблонов. Библиотека: {templateCount} активных
            шаблонов.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/js-constructor/templates"
            className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-4 py-2 text-sm hover:bg-[var(--accent)]"
          >
            <Library className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Библиотека шаблонов
          </Link>
          <Link
            href="/admin/js-constructor/new"
            className="flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Новая конфигурация
          </Link>
        </div>
      </div>

      {templateCount === 0 && (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 px-4 py-3 text-sm">
          В библиотеке нет активных шаблонов.{' '}
          <Link
            href="/admin/js-constructor/templates/new"
            className="text-[var(--color-brand)] underline"
          >
            Создать шаблон
          </Link>
        </div>
      )}

      {serialized.length === 0 && templateCount > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed py-20 text-center">
          <Code2
            className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]"
            strokeWidth={1}
            aria-hidden
          />
          <p className="font-medium">Конфигураций пока нет</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Нажмите «Новая конфигурация», чтобы запустить мастер сборки.
          </p>
        </div>
      ) : (
        <ConfigsClient configs={serialized} />
      )}
    </div>
  )
}
