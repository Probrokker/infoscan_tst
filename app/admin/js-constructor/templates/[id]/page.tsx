import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TemplateForm } from '../TemplateForm'
import type { JsTemplateData } from '@/lib/js-constructor-types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Редактирование шаблона — Инфоскан Admin' }

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await prisma.jsTemplate.findUnique({ where: { id } })
  if (!t) notFound()

  const template: JsTemplateData = {
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.category,
    version: t.version,
    code: t.code,
    params: t.params as unknown as JsTemplateData['params'],
    stages: t.stages as unknown as JsTemplateData['stages'],
    compatibleWith: t.compatibleWith,
    order: t.order,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link href="/admin/js-constructor" className="hover:text-[var(--foreground)]">
            Конструктор JS
          </Link>
          <span>/</span>
          <Link href="/admin/js-constructor/templates" className="hover:text-[var(--foreground)]">
            Шаблоны
          </Link>
          <span>/</span>
          <span>{t.name}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Редактирование: {t.name}</h1>
      </div>
      <TemplateForm template={template} />
    </div>
  )
}
