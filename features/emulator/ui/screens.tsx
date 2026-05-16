'use client'

/**
 * Все 12 экранов эмулятора. Каждый — простой презентационный компонент,
 * читающий состояние из useEmulatorStore. События кидаются через store.dispatch.
 *
 * Стиль приближен к скриншотам из веб-инструкции: жёлтые акцентные кнопки,
 * чёрный текст, верхний баннер статуса, нижняя плашка с метаданными.
 */
import * as React from 'react'
import { Settings, History, Camera, RefreshCw, RotateCcw } from 'lucide-react'
import { useEmulatorStore } from '../model/store'
import { formatNumber } from '@/lib/utils'

// ---- Загрузка ----

export function LoadingScreen() {
  const dispatch = useEmulatorStore((s) => s.dispatch)
  React.useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'BOOT_DONE' }), 1200)
    return () => clearTimeout(t)
  }, [dispatch])
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-50">
      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-[var(--color-yellow-brand)] text-3xl font-bold text-zinc-900">
        И
      </div>
      <div className="text-xs text-zinc-500">Проверка датчиков: ЛД · ВД · InfSen</div>
      <div className="text-xs font-mono text-red-600">v 2.4.1</div>
    </div>
  )
}

// ---- Авторизация ----

export function AuthScreen() {
  const { dispatch, scanBarcode } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white p-6 text-center">
      <Camera className="h-12 w-12 text-zinc-400" strokeWidth={1.5} />
      <div className="text-lg font-semibold">Отсканируйте штрих-код сотрудника</div>
      <button
        className="rounded-lg bg-[var(--color-yellow-brand)] px-6 py-3 font-semibold text-zinc-900"
        onClick={() => {
          scanBarcode('EMP-0042')
          dispatch({ type: 'AUTH_SCAN' })
        }}
      >
        Имитировать скан
      </button>
    </div>
  )
}

// ---- PIN ----

export function PinPadScreen() {
  const { pinBuffer, pressPin, clearPin, submitPin, dispatch } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          ← Назад
        </button>
        <div className="text-sm font-semibold">Введите PIN</div>
        <span aria-hidden className="w-12" />
      </div>
      <div className="mb-4 flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-12 w-10 items-center justify-center rounded border-2 border-zinc-300 bg-white text-2xl font-bold"
          >
            {pinBuffer[i] ? '•' : ''}
          </div>
        ))}
      </div>
      <div className="mx-auto grid w-64 grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            className="h-14 rounded-lg bg-white text-xl font-bold shadow"
            onClick={() => pressPin(d)}
          >
            {d}
          </button>
        ))}
        <button className="h-14 rounded-lg bg-zinc-200 text-sm" onClick={clearPin}>
          Сброс
        </button>
        <button
          className="h-14 rounded-lg bg-white text-xl font-bold shadow"
          onClick={() => pressPin('0')}
        >
          0
        </button>
        <button
          className="h-14 rounded-lg bg-[var(--color-yellow-brand)] text-sm font-semibold"
          onClick={submitPin}
        >
          OK
        </button>
      </div>
    </div>
  )
}

export function PinErrorScreen() {
  const { dispatch, pinAttempts } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-red-50 p-6 text-center">
      <div className="text-5xl">⛔</div>
      <div className="text-lg font-semibold text-red-700">Неверный PIN-код</div>
      <div className="text-xs text-red-600">Попыток: {pinAttempts}</div>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-[var(--color-yellow-brand)] px-4 py-2 font-semibold text-zinc-900"
          onClick={() => dispatch({ type: 'PIN_RESET' })}
        >
          Ввести снова
        </button>
        <button
          className="rounded-lg bg-zinc-200 px-4 py-2"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          На главную
        </button>
      </div>
    </div>
  )
}

// ---- Главный экран измерения ----

export function MainScreen() {
  const { sensor, barcode, dispatch, model } = useEmulatorStore()
  const status = sensor.weight != null ? 'Готово к записи' : 'Положите объект'
  const statusColor = sensor.weight != null ? 'bg-emerald-500' : 'bg-amber-500'

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Шапка */}
      <div className={`flex items-center justify-between px-4 py-2 ${statusColor} text-white`}>
        <span className="text-xs font-semibold">{status}</span>
        <span className="text-xs">{model.toUpperCase()}</span>
        <div className="flex gap-2">
          <button aria-label="История" onClick={() => dispatch({ type: 'GO_HISTORY' })}>
            <History className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button aria-label="Настройки" onClick={() => dispatch({ type: 'GO_SETTINGS' })}>
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Тело */}
      <div className="flex flex-1 gap-3 p-3">
        <div className="flex-1 space-y-2">
          <Metric label="Ш, мм" value={sensor.width} />
          <Metric label="В, мм" value={sensor.height} />
          <Metric label="Г, мм" value={sensor.length} />
          <Metric label="Масса, кг" value={sensor.weight} digits={2} />
        </div>
        <div className="flex w-32 flex-col items-center justify-center gap-2 rounded bg-zinc-100 p-2">
          <div className="text-xs text-zinc-500">QR-код</div>
          <div className="grid h-20 w-20 grid-cols-6 grid-rows-6 gap-px bg-white p-1">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className={i % 3 === 0 ? 'bg-zinc-900' : ''} />
            ))}
          </div>
          {barcode && (
            <div className="break-all text-center font-mono text-[10px]">{barcode}</div>
          )}
        </div>
      </div>

      {/* Низ — Item Type */}
      <div className="border-t bg-zinc-50 px-3 py-2 text-xs">
        <button
          className="text-zinc-700 underline"
          onClick={() => dispatch({ type: 'ITEM_TYPE_OPEN' })}
        >
          Item Type →
        </button>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  digits = 0,
}: {
  label: string
  value: number | null
  digits?: number
}) {
  return (
    <div className="flex items-baseline justify-between rounded bg-zinc-50 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-mono text-xl font-bold tabular-nums">
        {value == null
          ? '—'
          : digits > 0
            ? value.toFixed(digits)
            : formatNumber(Math.round(value))}
      </span>
    </div>
  )
}

// ---- Меню настроек ----

export function SettingsMenuScreen() {
  const { dispatch } = useEmulatorStore()
  const items: Array<{ label: string; event: 'GO_NETWORK' | 'GO_CAL_LASER' | 'GO_CAL_WEIGHT' }> =
    [
      { label: 'Настройки сети', event: 'GO_NETWORK' },
      { label: 'Калибровка лазерных датчиков', event: 'GO_CAL_LASER' },
      { label: 'Калибровка весового датчика', event: 'GO_CAL_WEIGHT' },
    ]
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          ← Главная
        </button>
        <div className="font-semibold">Настройки</div>
        <span aria-hidden className="w-12" />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.event}>
            <button
              className="w-full rounded-lg bg-white p-3 text-left font-medium shadow-sm hover:bg-zinc-100"
              onClick={() => dispatch({ type: item.event })}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---- Настройки сети ----

export function NetworkSettingsScreen() {
  const { dispatch } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_SETTINGS' })}
        >
          ← Настройки
        </button>
        <div className="font-semibold">Сеть</div>
        <span aria-hidden className="w-12" />
      </div>
      <div className="rounded-lg bg-white p-4 text-sm shadow-sm">
        <div className="mb-3 font-semibold">Проводное подключение</div>
        <div className="space-y-1 font-mono text-xs">
          <div>Режим: <strong>DHCP</strong></div>
          <div>IP: 192.168.1.42</div>
          <div>Маска: 255.255.255.0</div>
          <div>Шлюз: 192.168.1.1</div>
        </div>
      </div>
    </div>
  )
}

// ---- Калибровки ----

export function CalibrationLaserScreen() {
  const { dispatch } = useEmulatorStore()
  return (
    <CalibrationLayout
      title="Калибровка ЛД"
      desc="Установите калибровочный кубик 20×20×20 мм в угол. Нажмите «Включить ЛД» и проверьте, что лучи попадают в центры граней."
      back={() => dispatch({ type: 'BACK_TO_SETTINGS' })}
    />
  )
}

export function CalibrationWeightScreen() {
  const { dispatch } = useEmulatorStore()
  return (
    <CalibrationLayout
      title="Калибровка ВД"
      desc="Положите гирю 20–40 кг. Введите её точный вес в граммах и нажмите «Откалибровать»."
      back={() => dispatch({ type: 'BACK_TO_SETTINGS' })}
    />
  )
}

function CalibrationLayout({ title, desc, back }: { title: string; desc: string; back: () => void }) {
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button className="text-sm text-zinc-600" onClick={back}>← Настройки</button>
        <div className="font-semibold">{title}</div>
        <span aria-hidden className="w-12" />
      </div>
      <div className="rounded-lg bg-white p-4 text-sm shadow-sm">
        <p>{desc}</p>
        <button className="mt-3 w-full rounded bg-[var(--color-yellow-brand)] py-2 font-semibold">
          Откалибровать
        </button>
      </div>
    </div>
  )
}

// ---- История ----

export function HistoryScreen() {
  const { history, dispatch } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          ← Главная
        </button>
        <div className="font-semibold">История измерений</div>
        <span aria-hidden className="w-12" />
      </div>
      {history.length === 0 ? (
        <div className="text-sm text-zinc-500">Измерений ещё не было.</div>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {history.map((r) => (
            <li key={r.id} className="rounded bg-white p-2 text-xs shadow-sm">
              <div className="flex justify-between font-mono">
                <span>#{r.id}</span>
                <span>{new Date(r.timestamp).toLocaleTimeString('ru-RU')}</span>
              </div>
              <div className="mt-1 font-mono">
                {r.barcode} · {r.sensor.width}×{r.sensor.height}×{r.sensor.length} мм ·{' '}
                {r.sensor.weight} кг
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Item Type ----

export function ItemTypeListScreen() {
  const { dispatch, pickItemTypePack } = useEmulatorStore()
  const packs = ['Штука', 'Коробка', 'Паллета']
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          ← Главная
        </button>
        <div className="font-semibold">Выберите тип упаковки</div>
        <span aria-hidden className="w-12" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {packs.map((p) => (
          <button
            key={p}
            className="rounded-lg bg-[var(--color-yellow-brand)] p-6 text-lg font-semibold text-zinc-900"
            onClick={() => {
              pickItemTypePack(p)
              dispatch({ type: 'ITEM_TYPE_PICK' })
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ItemTypeCountScreen() {
  const { itemTypeCount, setItemTypeCount, dispatch } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col bg-zinc-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="text-sm text-zinc-600"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          ← Главная
        </button>
        <div className="font-semibold">Введите количество</div>
        <span aria-hidden className="w-12" />
      </div>
      <div className="mb-3 text-center font-mono text-5xl tabular-nums">{itemTypeCount}</div>
      <div className="mx-auto grid w-64 grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            className="h-12 rounded bg-white text-xl font-bold shadow"
            onClick={() => setItemTypeCount(Number(String(itemTypeCount) + d))}
          >
            {d}
          </button>
        ))}
        <button
          className="h-12 rounded bg-zinc-200 text-sm"
          onClick={() => setItemTypeCount(0)}
        >
          Сброс
        </button>
        <button
          className="h-12 rounded bg-white text-xl font-bold shadow"
          onClick={() => setItemTypeCount(Number(String(itemTypeCount) + '0'))}
        >
          0
        </button>
        <button
          className="h-12 rounded bg-[var(--color-yellow-brand)] text-sm font-semibold"
          onClick={() => dispatch({ type: 'ITEM_TYPE_COUNT_OK' })}
        >
          OK
        </button>
      </div>
    </div>
  )
}

export function ItemTypeConfirmScreen() {
  const { barcode, dispatch } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-6 text-center">
      <div className="text-sm text-zinc-600">Подтвердите наименование товара</div>
      <div className="text-xl font-semibold">{barcode || 'Штрих-код не считан'}</div>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-[var(--color-yellow-brand)] px-4 py-2 font-semibold"
          onClick={() => dispatch({ type: 'ITEM_TYPE_CONFIRM' })}
        >
          Подтвердить
        </button>
        <button
          className="rounded-lg bg-zinc-200 px-4 py-2"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

// ---- Ошибка измерения ----

export function MeasurementErrorScreen() {
  const { dispatch, clearSensor } = useEmulatorStore()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-red-50 p-6 text-center">
      <RefreshCw className="h-10 w-10 text-red-600" strokeWidth={1.5} />
      <div className="text-lg font-semibold text-red-700">Ошибка измерения</div>
      <div className="text-sm text-red-600">
        Проверьте, что объект полностью в зоне платформы и не выходит за лазеры.
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-[var(--color-yellow-brand)] px-4 py-2 font-semibold"
          onClick={() => {
            clearSensor()
            dispatch({ type: 'RETRY_MEASURE' })
          }}
        >
          <RotateCcw className="mr-1 inline h-4 w-4" strokeWidth={1.5} /> Повторить
        </button>
        <button
          className="rounded-lg bg-zinc-200 px-4 py-2"
          onClick={() => dispatch({ type: 'BACK_TO_MAIN' })}
        >
          На главную
        </button>
      </div>
    </div>
  )
}

// ---- Map screen → component ----

import type { ScreenId } from '../model/machine'

export const SCREENS: Record<ScreenId, React.ComponentType> = {
  loading: LoadingScreen,
  auth: AuthScreen,
  pinPad: PinPadScreen,
  pinError: PinErrorScreen,
  main: MainScreen,
  settingsMenu: SettingsMenuScreen,
  networkSettings: NetworkSettingsScreen,
  calibrationLaser: CalibrationLaserScreen,
  calibrationWeight: CalibrationWeightScreen,
  history: HistoryScreen,
  itemTypeList: ItemTypeListScreen,
  itemTypeCount: ItemTypeCountScreen,
  itemTypeConfirm: ItemTypeConfirmScreen,
  measurementError: MeasurementErrorScreen,
}
