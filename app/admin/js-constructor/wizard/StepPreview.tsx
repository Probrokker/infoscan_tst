'use client'

import * as React from 'react'
import { Copy, Download, Check, Save } from 'lucide-react'
import { toast } from 'sonner'
import { JsEditor } from '@/components/admin/JsEditor'
import { generateCode } from '@/lib/js-constructor-types'
import type { JsTemplateData, WizardState } from '@/lib/js-constructor-types'

interface Props {
  templates: JsTemplateData[]
  state: WizardState
  onUpdate: (partial: Partial<WizardState>) => void
  onSave: () => Promise<void>
  saving: boolean
}

export function StepPreview({ templates, state, onUpdate, onSave, saving }: Props) {
  const [copied, setCopied] = React.useState(false)

  const code = React.useMemo(
    () => generateCode(templates, state.values, state.connections),
    [templates, state.values, state.connections],
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Код скопирован в буфер обмена')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const filename = state.name
      ? `${state.name.toLowerCase().replace(/\s+/g, '-')}.js`
      : 'infoscan-config.js'
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Файл ${filename} скачан`)
  }

  return (
    <div className="space-y-6">
      {/* Мета конфигурации */}
      <div className="rounded-[var(--radius-card)] border p-4">
        <h3 className="mb-3 font-semibold">Информация о конфигурации</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cfg-name" className="mb-1 block text-sm font-medium">
              Название *
            </label>
            <input
              id="cfg-name"
              value={state.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Например: Интеграция с 1С для Магазин №1"
              className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="cfg-client" className="mb-1 block text-sm font-medium">
              Клиент / объект
            </label>
            <input
              id="cfg-client"
              value={state.clientName}
              onChange={(e) => onUpdate({ clientName: e.target.value })}
              placeholder="ООО Ромашка, ТЦ Центральный…"
              className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cfg-desc" className="mb-1 block text-sm font-medium">
              Комментарий
            </label>
            <textarea
              id="cfg-desc"
              value={state.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={2}
              placeholder="Дополнительные заметки…"
              className="w-full rounded border bg-[var(--muted)] px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Превью кода */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Итоговый JS-код</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {templates.length} шаблон(-ов) · {code.split('\n').length} строк
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
            >
              {copied ? (
                <Check
                  className="h-4 w-4 text-[var(--color-success)]"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              )}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
            >
              <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Скачать .js
            </button>
          </div>
        </div>

        <JsEditor value={code} readOnly minHeight="360px" />
      </div>

      {/* Сохранение */}
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border bg-[var(--muted)] px-4 py-3">
        <div className="flex-1 text-sm text-[var(--muted-foreground)]">
          Сохрани конфигурацию, чтобы вернуться к ней позже или отправить клиенту.
        </div>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !state.name.trim()}
          className="flex shrink-0 items-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {saving ? 'Сохраняем…' : 'Сохранить конфигурацию'}
        </button>
      </div>
    </div>
  )
}
