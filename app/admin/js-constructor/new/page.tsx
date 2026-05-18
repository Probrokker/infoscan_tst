import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { WizardShell } from '../wizard/WizardShell'
import type { JsTemplateData } from '@/lib/js-constructor-types'

export const metadata = { title: 'Новая конфигурация — Инфоскан Admin' }
export const dynamic = 'force-dynamic'

export default async function NewConfigPage() {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const templates = await prisma.jsTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })

  const allTemplates: JsTemplateData[] = templates.map((t) => ({
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
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link href="/admin/js-constructor" className="hover:text-[var(--foreground)]">
            Конструктор JS
          </Link>
          <span>/</span>
          <span>Новая конфигурация</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Мастер сборки конфигурации</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Пройди 4 шага: выбери шаблоны, настрой связи, заполни параметры, получи код.
        </p>
      </div>

      <WizardShell allTemplates={allTemplates} />
    </div>
  )
}
