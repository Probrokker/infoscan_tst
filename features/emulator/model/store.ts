'use client'

/**
 * Store эмулятора: текущий экран, состояние датчиков (SENSOR.*), штрих-код,
 * PIN-ввод, история, выбранная модель устройства.
 *
 * Без persist — сессия эмулятора эфемерная.
 */
import { create } from 'zustand'
import { transition, type Event, type ScreenId } from './machine'
import type { TargetModel } from '@/features/builder'

export interface SensorState {
  width: number | null
  height: number | null
  length: number | null
  weight: number | null
}

export interface MeasurementRecord {
  id: number
  timestamp: number
  barcode: string
  sensor: SensorState
}

interface EmulatorState {
  model: TargetModel
  screen: ScreenId
  barcode: string
  additionalBarcodes: string[]
  sensor: SensorState
  pinBuffer: string
  pinAttempts: number
  history: MeasurementRecord[]
  // Item Type — что выбрал оператор
  itemTypePack: string
  itemTypeCount: number
  // Был ли последний шаблон применён к измерению
  lastSentPayload: string | null
}

interface EmulatorActions {
  dispatch: (event: Event) => void
  setModel: (model: TargetModel) => void
  scanBarcode: (code: string) => void
  setSensor: (sensor: Partial<SensorState>) => void
  generateRandomMeasurement: () => void
  clearSensor: () => void
  pressPin: (digit: string) => void
  clearPin: () => void
  submitPin: () => void
  pickItemTypePack: (pack: string) => void
  setItemTypeCount: (n: number) => void
  recordMeasurement: () => MeasurementRecord
  setLastPayload: (payload: string | null) => void
  reset: () => void
}

const INITIAL_STATE: EmulatorState = {
  model: 'infoscan-3d-90',
  screen: 'loading',
  barcode: '',
  additionalBarcodes: [],
  sensor: { width: null, height: null, length: null, weight: null },
  pinBuffer: '',
  pinAttempts: 0,
  history: [],
  itemTypePack: '',
  itemTypeCount: 0,
  lastSentPayload: null,
}

const CORRECT_PIN = '1234'

export const useEmulatorStore = create<EmulatorState & EmulatorActions>((set, get) => ({
  ...INITIAL_STATE,

  dispatch: (event) => {
    set((s) => ({ screen: transition(s.screen, event) }))
  },

  setModel: (model) => set({ model }),

  scanBarcode: (code) => set({ barcode: code }),

  setSensor: (patch) => set((s) => ({ sensor: { ...s.sensor, ...patch } })),

  generateRandomMeasurement: () => {
    const m = get().model
    // Подбираем диапазоны в зависимости от модели
    const ranges = {
      'infoscan-3d-60': { wh: [50, 580], len: [50, 580] },
      'infoscan-3d-90': { wh: [50, 830], len: [50, 830] },
      'infoscan-camera': { wh: [50, 580], len: [50, 580] },
    } as const
    const r = ranges[m]
    const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min))
    set({
      sensor: {
        width: rand(r.wh[0], r.wh[1]),
        height: rand(r.wh[0], r.wh[1]),
        length: rand(r.len[0], r.len[1]),
        weight: Math.round((0.5 + Math.random() * 49) * 100) / 100,
      },
    })
  },

  clearSensor: () => set({ sensor: { width: null, height: null, length: null, weight: null } }),

  pressPin: (digit) => set((s) => ({ pinBuffer: (s.pinBuffer + digit).slice(0, 4) })),

  clearPin: () => set({ pinBuffer: '' }),

  submitPin: () => {
    const { pinBuffer, pinAttempts } = get()
    if (pinBuffer === CORRECT_PIN) {
      set({ pinBuffer: '', pinAttempts: 0 })
      get().dispatch({ type: 'PIN_OK' })
    } else {
      set({ pinAttempts: pinAttempts + 1 })
      get().dispatch({ type: 'PIN_FAIL' })
    }
  },

  pickItemTypePack: (pack) => set({ itemTypePack: pack }),

  setItemTypeCount: (n) => set({ itemTypeCount: n }),

  recordMeasurement: () => {
    const { sensor, barcode, history } = get()
    const record: MeasurementRecord = {
      id: history.length + 1,
      timestamp: Date.now(),
      barcode,
      sensor: { ...sensor },
    }
    set({ history: [record, ...history].slice(0, 50) })
    return record
  },

  setLastPayload: (lastSentPayload) => set({ lastSentPayload }),

  reset: () => set(INITIAL_STATE),
}))
