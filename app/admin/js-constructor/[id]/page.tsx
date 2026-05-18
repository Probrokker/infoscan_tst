import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { WizardShell } from '../wizard/WizardShell'
import type { JsTemplateData, WizardState } from '@/lib/js-constructor-types'

export const dynamic = 'force-dynamic'

export default async function EditConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  const [config, templates] = await Promise.all([
    prisma.jsConfig.findUnique({ where: { id } }),
    prisma.jsTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    }),
  ])

  if (!config) notFound()

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

  const initialState: Partial<WizardState> = {
    selectedIds: config.templateIds,
    connections: (config.connections as WizardState['connections']) ?? {},
    values: (config.values as WizardState['values']) ?? {},
    name: config.name,
    description: config.description ?? '',
    clientName: config.clientName ?? '',
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link href="/admin/js-constructor" className="hover:text-[var(--foreground)]">
            Конструктор JS
          </Link>
          <span>/</span>
          <span>{config.name}</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Редактирование: {config.name}</h1>
        {config.clientName && (
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            Клиент: {config.clientName}
          </p>
        )}
      </div>

      <WizardShell
        allTemplates={allTemplates}
        initialState={initialState}
        existingConfigId={config.id}
      />
    </div>
  )
}
