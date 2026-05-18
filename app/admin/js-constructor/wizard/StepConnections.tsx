'use client'

import * as React from 'react'
import { ArrowRight, Link2, Zap } from 'lucide-react'
import type { JsTemplateData } from '@/lib/js-constructor-types'

interface Props {
  templates: JsTemplateData[]
  connections: Record<string, Record<string, string>>
  onChange: (connections: Record<string, Record<string, string>>) => void
}

export function StepConnections({ templates, connections, onChange }: Props) {
  // Собираем все уникальные ключи параметров каждого шаблона
  function getParamKeys(t: JsTemplateData): string[] {
    const fromParams = t.params.map((p) => p.key)
    const fromStages = t.stages.flatMap((s) => s.fields.map((f) => f.key))
    return Array.from(new Set([...fromParams, ...fromStages]))
  }

  // Автосвязь: для каждого шаблона (кроме первого) ищем совпадающие ключи у предыдущих
  function autoConnect() {
    const newConn: Record<string, Record<string, string>> = {}

    for (let i = 1; i < templates.length; i++) {
      const current = templates[i]
      if (!current) continue
      const currentKeys = getParamKeys(current)

      for (const key of currentKeys) {
        for (let j = 0; j < i; j++) {
          const prev = templates[j]
          if (!prev) continue
          const prevKeys = getParamKeys(prev)
          if (prevKeys.includes(key)) {
            if (!newConn[current.id]) newConn[current.id] = {}
            newConn[current.id]![key] = `${prev.id}.${key}`
            break
          }
        }
      }
    }

    onChange(newConn)
  }

  function setConnection(toTemplateId: string, toKey: string, fromRef: string) {
    const updated = { ...connections }
    if (!updated[toTemplateId]) updated[toTemplateId] = {}
    if (fromRef === '') {
      const { [toKey]: _removed, ...rest } = updated[toTemplateId]
      updated[toTemplateId] = rest
    } else {
      updated[toTemplateId] = { ...updated[toTemplateId], [toKey]: fromRef }
    }
    onChange(updated)
  }

  if (templates.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[var(--radius-card)] border border-dashed text-sm text-[var(--muted-foreground)]">
        Выберите минимум 2 шаблона на шаге 1, чтобы настроить связи.
      </div>
    )
  }

  // Источники: все ключи всех шаблонов (кроме текущего)
  function getSources(excludeId: string): Array<{ label: string; value: string }> {
    const result: Array<{ label: string; value: string }> = []
    for (const t of templates) {
      if (t.id === excludeId) continue
      for (const key of getParamKeys(t)) {
        result.push({ label: `${t.name} → ${key}`, value: `${t.id}.${key}` })
      }
    }
    return result
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Связи между шаблонами</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Укажи, какое значение параметра одного шаблона нужно передать в параметр другого. Пустое
            поле — параметр заполняется вручную на следующем шаге.
          </p>
        </div>
        <button
          type="button"
          onClick={autoConnect}
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
          title="Автоматически связать одноимённые параметры"
        >
          <Zap className="h-3.5 w-3.5 text-[var(--color-warning)]" strokeWidth={1.5} aria-hidden />
          Автосвязь
        </button>
      </div>

      {/* Для каждого шаблона (кроме первого) — таблица его входных параметров */}
      {templates.slice(1).map((t, relIdx) => {
        const idx = relIdx + 1
        const keys = getParamKeys(t)
        const sources = getSources(t.id)
        const tConnections = connections[t.id] ?? {}

        return (
          <div key={t.id} className="rounded-[var(--radius-card)] border">
            <div className="flex items-center gap-2 border-b bg-[var(--muted)] px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-[11px] font-bold text-white">
                {idx + 1}
              </span>
              <span className="font-medium">{t.name}</span>
              <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                {Object.keys(tConnections).length} связей
              </span>
            </div>

            {keys.length === 0 ? (
              <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                У шаблона нет объявленных параметров.
              </p>
            ) : (
              <div className="divide-y">
                {keys.map((key) => {
                  const currentVal = tConnections[key] ?? ''
                  const hasLink = !!currentVal

                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs">
                          {key}
                        </code>
                        {hasLink && (
                          <Link2
                            className="h-3.5 w-3.5 text-[var(--color-brand)]"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        )}
                      </div>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <select
                        value={currentVal}
                        onChange={(e) => setConnection(t.id, key, e.target.value)}
                        className="min-w-[200px] rounded border bg-[var(--muted)] px-2 py-1 text-sm"
                      >
                        <option value="">— заполнить вручную —</option>
                        {sources.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
