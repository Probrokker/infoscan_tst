'use client'

/**
 * Корневой компонент эмулятора. Связывает «корпус» устройства с панелью управления
 * и блоком «Что было бы отправлено в WMS» — здесь видим JSON/XML, который шаблон
 * из конструктора выдал бы при текущих SENSOR.*.
 */
import * as React from 'react'
import { Cpu, Send, AlertCircle } from 'lucide-react'
import { DeviceFrame } from './DeviceFrame'
import { SCREENS } from './screens'
import { ControlPanel } from './ControlPanel'
import { useEmulatorStore } from '../model/store'
import { useBuilderStore, generateScript } from '@/features/builder'
import { TemplateSandbox, type SandboxResult } from '../lib/sandbox'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Callout } from '@/components/docs/Callout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function EmulatorApp() {
  const { screen, sensor, barcode, additionalBarcodes, history, model } = useEmulatorStore()
  const builderState = useBuilderStore()

  const sandboxContainerRef = React.useRef<HTMLDivElement>(null)
  const sandboxRef = React.useRef<TemplateSandbox | null>(null)
  const [result, setResult] = React.useState<SandboxResult | null>(null)
  const [running, setRunning] = React.useState(false)

  React.useEffect(() => {
    if (!sandboxContainerRef.current) return
    sandboxRef.current = new TemplateSandbox(sandboxContainerRef.current)
    return () => {
      sandboxRef.current?.destroy()
      sandboxRef.current = null
    }
  }, [])

  const runTemplate = React.useCallback(async () => {
    if (!sandboxRef.current) return
    setRunning(true)
    try {
      const code = generateScript(builderState)
      const context = {
        barcode,
        additionalBarcodes,
        devCode: `INF-${model.toUpperCase()}-EMU`,
        uniqueIndexHistory: history.length + 1,
        sensor: {
          widthFormat: sensor.width != null ? String(sensor.width) : '0',
          heightFormat: sensor.height != null ? String(sensor.height) : '0',
          lengthFormat: sensor.length != null ? String(sensor.length) : '0',
          depthFormat: sensor.length != null ? String(sensor.length) : '0',
          weightFormat: sensor.weight != null ? String(sensor.weight) : '0',
          volumeFormat:
            sensor.width != null && sensor.height != null && sensor.length != null
              ? ((sensor.width * sensor.height * sensor.length) / 1_000_000_000).toFixed(6)
              : '0',
          widthUnit: 'мм',
          heightUnit: 'мм',
          lengthUnit: 'мм',
          depthUnit: 'мм',
          weightUnit: 'кг',
          volumeUnit: 'м3',
        },
      }
      const r = await sandboxRef.current.run(code, context)
      setResult(r)
    } finally {
      setRunning(false)
    }
  }, [builderState, sensor, barcode, additionalBarcodes, history.length, model])

  const Screen = SCREENS[screen]

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Эмулятор устройства</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
          Симуляция экранов Инфоскана. Все измерения исполняются через шаблон из{' '}
          <Link href="/integration/builder" className="underline">
            конструктора
          </Link>{' '}
          в изолированной песочнице — реальная отправка в сеть отключена.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Левая колонка — корпус + результат */}
        <div className="space-y-6">
          <DeviceFrame>
            <Screen />
          </DeviceFrame>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                Что было бы отправлено в WMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {running && (
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Cpu className="h-4 w-4 animate-pulse" strokeWidth={1.5} aria-hidden />
                  Исполнение шаблона в песочнице…
                </div>
              )}
              {!running && !result && (
                <Callout kind="info" title="Шаблон ещё не запускался">
                  Положите объект на платформу (поля Ш/В/Г/масса) и нажмите «Запустить измерение».
                  Эмулятор возьмёт текущий шаблон из конструктора и покажет, что именно ушло бы
                  в WMS клиента.
                </Callout>
              )}
              {result && result.ok && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono uppercase text-[var(--muted-foreground)]">
                      transport:
                    </span>
                    <code className="rounded bg-[var(--muted)] px-2 py-0.5 font-mono">
                      {result.method}
                    </code>
                    {result.target && (
                      <>
                        <span className="font-mono uppercase text-[var(--muted-foreground)]">
                          target:
                        </span>
                        <code className="rounded bg-[var(--muted)] px-2 py-0.5 font-mono">
                          {result.target}
                        </code>
                      </>
                    )}
                  </div>
                  <pre className="overflow-x-auto rounded-[var(--radius-btn)] border bg-[var(--background)] p-3 text-xs">
                    <code className="font-mono">{result.body}</code>
                  </pre>
                </div>
              )}
              {result && !result.ok && (
                <Callout kind="danger" title="Ошибка в шаблоне">
                  <div className="flex items-start gap-2 font-mono text-xs">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                    {result.error}
                  </div>
                </Callout>
              )}
              <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                <Button asChild variant="link" size="sm" className="h-auto p-0">
                  <Link href="/integration/builder">
                    Редактировать шаблон в конструкторе →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка — панель управления */}
        <ControlPanel onRunTemplate={runTemplate} />
      </div>

      {/* Скрытый контейнер для iframe-песочницы */}
      <div ref={sandboxContainerRef} aria-hidden />
    </div>
  )
}
