import { prisma } from '@/lib/prisma'
import { ReferenceClient } from './ReferenceClient'

export const metadata = { title: 'Справочники — Инфоскан Admin' }

export default async function ReferencePage() {
  const [models, firmwares, variables] = await Promise.all([
    prisma.deviceModel.findMany({ orderBy: { order: 'asc' } }),
    prisma.firmwareVersion.findMany({ orderBy: { order: 'asc' } }),
    prisma.templateVariable.findMany({ orderBy: { order: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Справочники</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Модели устройств, версии прошивок, переменные шаблонов. Перетащи строку для изменения
          порядка.
        </p>
      </div>
      <ReferenceClient models={models} firmwares={firmwares} variables={variables} />
    </div>
  )
}
