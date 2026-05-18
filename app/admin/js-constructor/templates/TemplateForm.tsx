'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, HelpCircle } from 'lucide-react'
import { JsEditor } from '@/components/admin/JsEditor'
import { createTemplateAction, updateTemplateAction } from '../actions'
import type { JsTemplateData } from '@/lib/js-constructor-types'

const PARAM_TYPES = ['text', 'number', 'textarea', 'select', 'toggle', 'url', 'password']

const PARAMS_PLACEHOLDER = JSON.stringify(
  [
    {
      key: 'SERVER_URL',
      label: 'URL сервера',
      type: 'url',
      required: true,
      defaultValue: 'http://localhost',
      hint: 'Адрес внешней системы',
    },
  ],
  null,
  2,
)

const STAGES_PLACEHOLDER = JSON.stringify(
  [
    {
      id: 'connection',
      title: 'Подключение',
      description: 'Настройки соединения с внешней системой',
      fields: [
        { key: 'HOST', label: 'Хост', type: 'text', required: true },
        { key: 'PORT', label: 'Порт', type: 'number', defaultValue: '8080' },
      ],
    },
  ],
  null,
  2,
)

interface Props {
  template?: JsTemplateData
}

export function TemplateForm({ template }: Props) {
  const router = useRouter()
  const isEdit = !!template

  const [slug, setSlug] = React.useState(template?.slug ?? '')
  const [name, setName] = React.useState(template?.name ?? '')
  const [description, setDescription] = React.useState(template?.description ?? '')
  const [category, setCategory] = React.useState(template?.category ?? '')
  const [version, setVersion] = React.useState(template?.version ?? '1.0')
  const [code, setCode] = React.useState(
    template?.code ??
      '// Введите JS-код шаблона\n// Используйте {{VARIABLE_KEY}} для плейсхолдеров\n',
  )
  const [params, setParams] = React.useState(
    template ? JSON.stringify(template.params, null, 2) : '[]',
  )
  const [stages, setStages] = React.useState(
    template ? JSON.stringify(template.stages, null, 2) : '[]',
  )
  const [compatibleWith, setCompatibleWith] = React.useState(
    template?.compatibleWith.join(', ') ?? '',
  )
  const [order, setOrder] = React.useState(String(template?.order ?? 0))
  const [isActive, setIsActive] = React.useState(template?.isActive ?? true)
  const [saving, setSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'code' | 'params' | 'stages' | 'meta'>('code')

  function autoSlug(n: string) {
    return n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  function handleNameChange(n: string) {
    setName(n)
    if (!isEdit || slug === '') setSlug(autoSlug(n))
  }

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.append('slug', slug)
    fd.append('name', name)
    fd.append('description', description)
    fd.append('category', category)
    fd.append('version', version)
    fd.append('code', code)
    fd.append('params', params)
    fd.append('stages', stages)
    fd.append('compatibleWith', compatibleWith)
    fd.append('order', order)
    fd.append('isActive', String(isActive))

    const result = isEdit
      ? await updateTemplateAction(template.id, fd)
      : await createTemplateAction(fd)

    setSaving(false)

    if (result.ok) {
      toast.success(isEdit ? 'Шаблон сохранён' : 'Шаблон создан')
      if (!isEdit) router.push('/admin/js-constructor/templates')
    } else {
      toast.error(result.error ?? 'Ошибка сохранения')
    }
  }

  const tabs = [
    { id: 'code', label: 'JS-код' },
    { id: 'params', label: 'Параметры (JSON)' },
    { id: 'stages', label: 'Этапы (JSON)' },
    { id: 'meta', label: 'Мета' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Базовые поля */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tmpl-name" className="mb-1 block text-sm font-medium">
            Название *
          </label>
          <input
            id="tmpl-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Интеграция с 1С: Базовая"
            className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tmpl-slug" className="mb-1 block text-sm font-medium">
            Slug *
          </label>
          <input
            id="tmpl-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="1c-base-integration"
            className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 font-mono text-sm"
          />
        </div>
        <div>
          <label htmlFor="tmpl-category" className="mb-1 block text-sm font-medium">
            Категория / тип интеграции *
          </label>
          <input
            id="tmpl-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="1С, СКУД, ERP, RFID…"
            className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tmpl-version" className="mb-1 block text-sm font-medium">
            Версия
          </label>
          <input
            id="tmpl-version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0"
            className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="tmpl-desc" className="mb-1 block text-sm font-medium">
            Описание
          </label>
          <input
            id="tmpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание назначения шаблона"
            className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Табы */}
      <div>
        <div className="flex gap-1 border-b">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'border-b-2 border-[var(--color-brand)] text-[var(--color-brand)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === 'code' && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--muted-foreground)]">
                Используйте <code className="rounded bg-[var(--muted)] px-1">{'{{KEY}}'}</code> для
                плейсхолдеров. Они заменяются на значения из параметров при генерации.
              </p>
              <JsEditor value={code} onChange={setCode} minHeight="400px" />
            </div>
          )}

          {activeTab === 'params' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs text-[var(--muted-foreground)]">
                  JSON-массив параметров шаблона. Эти поля показываются на шаге «Параметры» в
                  мастере.
                </p>
                <button
                  type="button"
                  title="Показать пример"
                  onClick={() => setParams(PARAMS_PLACEHOLDER)}
                  className="flex items-center gap-1 text-xs text-[var(--color-brand)] hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  Пример
                </button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Типы: {PARAM_TYPES.join(', ')}
              </p>
              <JsEditor value={params} onChange={setParams} minHeight="320px" />
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-xs text-[var(--muted-foreground)]">
                  JSON-массив этапов настройки. Каждый этап — отдельный раздел на шаге «Параметры» в
                  мастере.
                </p>
                <button
                  type="button"
                  onClick={() => setStages(STAGES_PLACEHOLDER)}
                  className="flex items-center gap-1 text-xs text-[var(--color-brand)] hover:underline"
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  Пример
                </button>
              </div>
              <JsEditor value={stages} onChange={setStages} minHeight="320px" />
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tmpl-order" className="mb-1 block text-sm font-medium">
                  Порядок в списке
                </label>
                <input
                  id="tmpl-order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="tmpl-compat" className="mb-1 block text-sm font-medium">
                  Совместим с (slug через запятую)
                </label>
                <input
                  id="tmpl-compat"
                  value={compatibleWith}
                  onChange={(e) => setCompatibleWith(e.target.value)}
                  placeholder="1c-auth, rfid-base"
                  className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Пустое поле = совместим со всеми
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="tmpl-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="tmpl-active" className="text-sm">
                  Активен (виден в конструкторе)
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Сохранить */}
      <div className="flex gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !name || !slug || !category || !code}
          className="flex items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать шаблон'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/js-constructor/templates')}
          className="rounded-[var(--radius-btn)] border px-5 py-2 text-sm hover:bg-[var(--accent)]"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}
