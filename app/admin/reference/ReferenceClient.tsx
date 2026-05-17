'use client'

import * as React from 'react'
import { RefTable } from './RefTable'
import {
  createDeviceModelAction,
  updateDeviceModelAction,
  deleteDeviceModelAction,
  reorderDeviceModelsAction,
  createFirmwareVersionAction,
  updateFirmwareVersionAction,
  deleteFirmwareVersionAction,
  reorderFirmwareVersionsAction,
  createTemplateVariableAction,
  updateTemplateVariableAction,
  deleteTemplateVariableAction,
  reorderTemplateVariablesAction,
} from './actions'

type Tab = 'models' | 'firmwares' | 'variables'

interface ReferenceClientProps {
  models: {
    id: string
    displayName: string
    description: string | null
    isActive: boolean
    slug: string
    order: number
  }[]
  firmwares: {
    id: string
    displayName: string
    notes: string | null
    isActive: boolean
    slug: string
    order: number
  }[]
  variables: {
    id: string
    key: string
    displayName: string
    type: string
    description: string | null
    example: string | null
    order: number
  }[]
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'models', label: 'Модели устройств' },
  { id: 'firmwares', label: 'Версии прошивок' },
  { id: 'variables', label: 'Переменные шаблонов' },
]

export function ReferenceClient({ models, firmwares, variables }: ReferenceClientProps) {
  const [tab, setTab] = React.useState<Tab>('models')

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-[var(--color-brand)] text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'models' && (
        <RefTable
          items={models}
          hasActive
          columns={[
            { key: 'displayName', label: 'Название', placeholder: 'Напр. IS-301' },
            { key: 'description', label: 'Описание' },
          ]}
          onReorder={async (ids) => {
            const r = await reorderDeviceModelsAction(ids)
            if (!r.ok) throw new Error(r.error)
          }}
          onCreate={createDeviceModelAction}
          onUpdate={(id, fd) => updateDeviceModelAction(id, fd)}
          onDelete={deleteDeviceModelAction}
        />
      )}

      {tab === 'firmwares' && (
        <RefTable
          items={firmwares}
          hasActive
          columns={[
            { key: 'displayName', label: 'Версия', placeholder: 'Напр. 3.4.2' },
            { key: 'notes', label: 'Примечания' },
          ]}
          onReorder={async (ids) => {
            const r = await reorderFirmwareVersionsAction(ids)
            if (!r.ok) throw new Error(r.error)
          }}
          onCreate={createFirmwareVersionAction}
          onUpdate={(id, fd) => updateFirmwareVersionAction(id, fd)}
          onDelete={deleteFirmwareVersionAction}
        />
      )}

      {tab === 'variables' && (
        <RefTable
          items={variables}
          nameKey="key"
          columns={[
            {
              key: 'key',
              label: 'Ключ (CAPS)',
              placeholder: 'DEVICE_NAME',
              width: 'max-w-[160px]',
            },
            { key: 'displayName', label: 'Название' },
            { key: 'type', label: 'Тип', width: 'max-w-[100px]' },
            { key: 'example', label: 'Пример' },
          ]}
          onReorder={async (ids) => {
            const r = await reorderTemplateVariablesAction(ids)
            if (!r.ok) throw new Error(r.error)
          }}
          onCreate={createTemplateVariableAction}
          onUpdate={(id, fd) => updateTemplateVariableAction(id, fd)}
          onDelete={deleteTemplateVariableAction}
        />
      )}
    </div>
  )
}
