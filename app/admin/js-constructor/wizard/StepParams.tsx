'use client'

import * as React from 'react'
import { ChevronDown, Link2 } from 'lucide-react'
import type { JsTemplateData, ParamDef, WizardState } from '@/lib/js-constructor-types'

interface Props {
  templates: JsTemplateData[]
  values: WizardState['values']
  connections: WizardState['connections']
  onChange: (values: WizardState['values']) => void
}

function ParamField({
  param,
  value,
  onChange,
  isLinked,
  linkedFrom,
}: {
  param: ParamDef
  value: string
  onChange: (v: string) => void
  isLinked: boolean
  linkedFrom?: string | undefined
}) {
  const baseClass = 'w-full rounded border px-3 py-1.5 text-sm'
  const inputClass = `${baseClass} ${isLinked ? 'bg-[var(--color-brand)]/5 opacity-70' : 'bg-[var(--muted)]'}`

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <label className="text-sm font-medium">
          {param.label}
          {param.required && <span className="ml-0.5 text-[var(--color-error)]">*</span>}
        </label>
        {isLinked && (
          <span
            className="flex items-center gap-0.5 rounded-full bg-[var(--color-brand)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-brand)]"
            title={`Значение из: ${linkedFrom}`}
          >
            <Link2 className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden />
            Из связи
          </span>
        )}
      </div>

      {param.hint && <p className="mb-1 text-xs text-[var(--muted-foreground)]">{param.hint}</p>}

      {isLinked ? (
        <input
          type="text"
          value={linkedFrom ?? ''}
          readOnly
          className={inputClass}
          title="Значение берётся из связанного шаблона"
        />
      ) : param.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={param.defaultValue}
          className={inputClass}
        />
      ) : param.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">— выбрать —</option>
          {(param.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : param.type === 'toggle' ? (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`toggle-${param.key}`}
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
            className="h-4 w-4 rounded"
          />
          <label htmlFor={`toggle-${param.key}`} className="text-sm">
            {value === 'true' ? 'Включено' : 'Выключено'}
          </label>
        </div>
      ) : (
        <input
          type={
            param.type === 'password' ? 'password' : param.type === 'number' ? 'number' : 'text'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.defaultValue}
          className={inputClass}
        />
      )}
      <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
        {'{{'}
        {param.key}
        {'}}'}
      </div>
    </div>
  )
}

function TemplateSection({
  template,
  values,
  connections,
  onChange,
}: {
  template: JsTemplateData
  values: Record<string, string>
  connections: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const [openStages, setOpenStages] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(template.stages.map((s) => [s.id, true])),
  )

  function toggleStage(id: string) {
    setOpenStages((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Параметры верхнего уровня (не в этапах)
  const topParams = template.params
  // Ключи, которые задействованы в этапах (чтобы не дублировать)
  const stageKeys = new Set(template.stages.flatMap((s) => s.fields.map((f) => f.key)))
  const topOnlyParams = topParams.filter((p) => !stageKeys.has(p.key))

  return (
    <div className="space-y-4">
      {/* Параметры верхнего уровня */}
      {topOnlyParams.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {topOnlyParams.map((param) => {
            const isLinked = !!connections[param.key]
            const linkedRef = connections[param.key]
            return (
              <ParamField
                key={param.key}
                param={param}
                value={values[param.key] ?? param.defaultValue ?? ''}
                onChange={(v) => onChange(param.key, v)}
                isLinked={isLinked}
                linkedFrom={linkedRef}
              />
            )
          })}
        </div>
      )}

      {/* Этапы */}
      {template.stages.map((stage) => (
        <div key={stage.id} className="rounded-[var(--radius-card)] border">
          <button
            type="button"
            onClick={() => toggleStage(stage.id)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform ${
                openStages[stage.id] ? '' : '-rotate-90'
              }`}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="font-medium">{stage.title}</span>
            {stage.description && (
              <span className="ml-2 hidden text-xs text-[var(--muted-foreground)] sm:inline">
                {stage.description}
              </span>
            )}
          </button>

          {openStages[stage.id] && (
            <div className="grid gap-3 border-t px-4 py-3 sm:grid-cols-2">
              {stage.fields.map((param) => {
                const isLinked = !!connections[param.key]
                return (
                  <ParamField
                    key={param.key}
                    param={param}
                    value={values[param.key] ?? param.defaultValue ?? ''}
                    onChange={(v) => onChange(param.key, v)}
                    isLinked={isLinked}
                    linkedFrom={connections[param.key]}
                  />
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function StepParams({ templates, values, connections, onChange }: Props) {
  const [activeIdx, setActiveIdx] = React.useState(0)

  function setParam(templateId: string, key: string, val: string) {
    onChange({
      ...values,
      [templateId]: { ...(values[templateId] ?? {}), [key]: val },
    })
  }

  if (templates.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[var(--radius-card)] border border-dashed text-sm text-[var(--muted-foreground)]">
        Нет выбранных шаблонов
      </div>
    )
  }

  const current = templates[activeIdx] ?? templates[0]
  if (!current) return null
  const tConnections = connections[current.id] ?? {}
  const tValues = values[current.id] ?? {}
  const hasParams = current.params.length > 0 || current.stages.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      {/* Левая панель: список шаблонов */}
      <div className="space-y-1">
        {templates.map((t, idx) => {
          const tVals = values[t.id] ?? {}
          const allKeys = [
            ...t.params.map((p) => p.key),
            ...t.stages.flatMap((s) => s.fields.map((f) => f.key)),
          ]
          const connKeys = Object.keys(connections[t.id] ?? {})
          const filled = allKeys.filter((k) => !!tVals[k] || connKeys.includes(k)).length
          const required = [...t.params, ...t.stages.flatMap((s) => s.fields)].filter(
            (p) => p.required,
          ).length
          const filledRequired = [...t.params, ...t.stages.flatMap((s) => s.fields)]
            .filter((p) => p.required)
            .filter((p) => !!tVals[p.key] || connKeys.includes(p.key)).length

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`flex w-full flex-col items-start rounded-[var(--radius-btn)] px-3 py-2 text-left text-sm transition-colors ${
                activeIdx === idx
                  ? 'bg-[var(--color-brand)]/10 font-medium text-[var(--color-brand)]'
                  : 'hover:bg-[var(--accent)]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand)]/20 text-[9px] font-bold text-[var(--color-brand)]">
                  {idx + 1}
                </span>
                {t.name}
              </span>
              {allKeys.length > 0 && (
                <span className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                  {filled}/{allKeys.length} заполнено
                  {required > 0 && filledRequired < required && (
                    <span className="ml-1 text-[var(--color-error)]">
                      · {required - filledRequired} обязат.
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Правая панель: форма текущего шаблона */}
      <div>
        <div className="mb-4">
          <h3 className="font-semibold">{current.name}</h3>
          {current.description && (
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{current.description}</p>
          )}
        </div>

        {!hasParams ? (
          <div className="rounded-[var(--radius-card)] border border-dashed py-8 text-center text-sm text-[var(--muted-foreground)]">
            У этого шаблона нет параметров для настройки.
          </div>
        ) : (
          <TemplateSection
            template={current}
            values={tValues}
            connections={tConnections}
            onChange={(key, val) => setParam(current.id, key, val)}
          />
        )}
      </div>
    </div>
  )
}
