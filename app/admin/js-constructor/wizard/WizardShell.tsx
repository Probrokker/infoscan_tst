'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { StepSelectTemplates } from './StepSelectTemplates'
import { StepConnections } from './StepConnections'
import { StepParams } from './StepParams'
import { StepPreview } from './StepPreview'
import { saveConfigAction } from '../actions'
import { EMPTY_WIZARD_STATE } from '@/lib/js-constructor-types'
import type { JsTemplateData, WizardState } from '@/lib/js-constructor-types'

const STEPS = [
  { id: 'select', label: 'Шаблоны' },
  { id: 'connections', label: 'Связи' },
  { id: 'params', label: 'Параметры' },
  { id: 'preview', label: 'Код и сохранение' },
]

interface Props {
  allTemplates: JsTemplateData[]
  initialState?: Partial<WizardState>
  existingConfigId?: string
}

export function WizardShell({ allTemplates, initialState, existingConfigId }: Props) {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [state, setState] = React.useState<WizardState>({
    ...EMPTY_WIZARD_STATE,
    ...initialState,
  })

  function update(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }))
  }

  const selectedTemplates = state.selectedIds
    .map((id) => allTemplates.find((t) => t.id === id))
    .filter(Boolean) as JsTemplateData[]

  function canProceed(): boolean {
    if (step === 0) return state.selectedIds.length > 0
    if (step === 3) return !!state.name.trim()
    return true
  }

  function handleNext() {
    if (!canProceed()) {
      if (step === 0) toast.error('Выберите хотя бы один шаблон')
      if (step === 3) toast.error('Введите название конфигурации')
      return
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1)
  }

  async function handleSave() {
    if (!state.name.trim()) {
      toast.error('Введите название конфигурации')
      return
    }
    setSaving(true)
    const result = await saveConfigAction(state, selectedTemplates, existingConfigId)
    setSaving(false)
    if (result.ok) {
      toast.success(existingConfigId ? 'Конфигурация сохранена' : 'Конфигурация создана')
      router.push('/admin/js-constructor')
    } else {
      toast.error(result.error ?? 'Ошибка сохранения')
    }
  }

  return (
    <div className="space-y-6">
      {/* Прогресс-бар */}
      <nav aria-label="Шаги мастера">
        <ol className="flex items-center">
          {STEPS.map((s, idx) => {
            const isActive = idx === step
            const isDone = idx < step
            return (
              <li key={s.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => idx < step && setStep(idx)}
                  disabled={idx > step}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--color-brand)]'
                      : isDone
                        ? 'cursor-pointer text-[var(--color-success)] hover:text-[var(--color-brand)]'
                        : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isActive
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                        : isDone
                          ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                          : 'border-[var(--border)] bg-[var(--muted)]'
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded ${
                      isDone ? 'bg-[var(--color-success)]' : 'bg-[var(--border)]'
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Шаги */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <StepSelectTemplates
            allTemplates={allTemplates}
            selectedIds={state.selectedIds}
            onChange={(selectedIds) => update({ selectedIds })}
          />
        )}
        {step === 1 && (
          <StepConnections
            templates={selectedTemplates}
            connections={state.connections}
            onChange={(connections) => update({ connections })}
          />
        )}
        {step === 2 && (
          <StepParams
            templates={selectedTemplates}
            values={state.values}
            connections={state.connections}
            onChange={(values) => update({ values })}
          />
        )}
        {step === 3 && (
          <StepPreview
            templates={selectedTemplates}
            state={state}
            onUpdate={update}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>

      {/* Навигация */}
      <div className="flex items-center justify-between border-t pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-[var(--radius-btn)] border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Назад
        </button>

        <span className="text-xs text-[var(--muted-foreground)]">
          Шаг {step + 1} из {STEPS.length}
        </span>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Далее
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !state.name.trim()}
            className="flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
            {saving ? 'Сохраняем…' : existingConfigId ? 'Сохранить' : 'Создать конфигурацию'}
          </button>
        )}
      </div>
    </div>
  )
}
