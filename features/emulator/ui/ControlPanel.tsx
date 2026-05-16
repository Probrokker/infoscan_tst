'use client'

/**
 * Боковая панель управления симуляцией.
 * Имитирует действия оператора над физическим устройством: скан, размещение объекта,
 * запуск измерения, имитация ошибки.
 */
import * as React from 'react'
import { Scan, Boxes, Play, AlertTriangle, Dice5, RotateCcw } from 'lucide-react'
import { useEmulatorStore } from '../model/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MODELS } from '@/lib/constants'

export function ControlPanel({ onRunTemplate }: { onRunTemplate: () => void }) {
  const {
    model,
    setModel,
    barcode,
    scanBarcode,
    sensor,
    setSensor,
    generateRandomMeasurement,
    clearSensor,
    dispatch,
    recordMeasurement,
    reset,
    screen,
  } = useEmulatorStore()

  const [scanInput, setScanInput] = React.useState('')

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Модель устройства</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={model} onValueChange={(v) => setModel(v as typeof model)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Действия</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="scan" className="mb-2 block text-xs">
              Сканировать ШК товара
            </Label>
            <div className="flex gap-2">
              <Input
                id="scan"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="4607062470015"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (scanInput.trim()) scanBarcode(scanInput.trim())
                }}
              >
                <Scan className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </div>
            {barcode && (
              <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                Текущий: {barcode}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={generateRandomMeasurement}
          >
            <Dice5 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            Случайные значения SENSOR
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Ш, мм</Label>
              <Input
                type="number"
                value={sensor.width ?? ''}
                onChange={(e) =>
                  setSensor({ width: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label className="text-xs">В, мм</Label>
              <Input
                type="number"
                value={sensor.height ?? ''}
                onChange={(e) =>
                  setSensor({ height: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Г, мм</Label>
              <Input
                type="number"
                value={sensor.length ?? ''}
                onChange={(e) =>
                  setSensor({ length: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Масса, кг</Label>
              <Input
                type="number"
                step="0.01"
                value={sensor.weight ?? ''}
                onChange={(e) =>
                  setSensor({ weight: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              className="w-full"
              onClick={() => {
                recordMeasurement()
                onRunTemplate()
              }}
              disabled={sensor.weight == null || screen !== 'main'}
            >
              <Play className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Запустить измерение
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                clearSensor()
                dispatch({ type: 'MEASURE_FAIL' })
              }}
            >
              <AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Имитировать ошибку
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={reset}>
              <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Сбросить эмулятор
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Перейти к экрану</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'GO_SETTINGS' })}>
              Настройки
            </Button>
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'GO_HISTORY' })}>
              <Boxes className="h-3 w-3" strokeWidth={1.5} aria-hidden /> История
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'ITEM_TYPE_OPEN' })}
            >
              Item Type
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'AUTH_SCAN' })}
            >
              Авторизация
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
