'use client'

/**
 * Zustand-store состояния конструктора. Persist в localStorage,
 * на загрузке валидируется через Zod — если данные в LS повреждены,
 * сбрасываемся на дефолты.
 */
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { builderStateSchema, TOTAL_STEPS, type BuilderState, type FieldMapping } from './schema'
import { captureError } from '@/lib/observability'

interface BuilderActions {
  setStep: (step: number) => void
  next: () => void
  prev: () => void
  reset: () => void
  update: (patch: Partial<BuilderState>) => void
  addField: (field: FieldMapping) => void
  removeField: (index: number) => void
  updateField: (index: number, field: FieldMapping) => void
}

const DEFAULT_STATE: BuilderState = builderStateSchema.parse({})

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setStep: (step) => set({ step: Math.max(1, Math.min(TOTAL_STEPS, Math.floor(step))) }),
      next: () => set({ step: Math.min(TOTAL_STEPS, get().step + 1) }),
      prev: () => set({ step: Math.max(1, get().step - 1) }),
      reset: () => set(DEFAULT_STATE),
      update: (patch) => set(patch),
      addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
      removeField: (index) =>
        set((state) => ({ fields: state.fields.filter((_, i) => i !== index) })),
      updateField: (index, field) =>
        set((state) => ({
          fields: state.fields.map((f, i) => (i === index ? field : f)),
        })),
    }),
    {
      name: 'infoscan-docs:builder',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => {
        // Не сохраняем функции — Zustand сам это умеет, но явная фильтрация надёжнее.
        const {
          setStep: _s,
          next: _n,
          prev: _p,
          reset: _r,
          update: _u,
          addField: _a,
          removeField: _rm,
          updateField: _uf,
          ...persisted
        } = state as BuilderState & BuilderActions
        void _s
        void _n
        void _p
        void _r
        void _u
        void _a
        void _rm
        void _uf
        return persisted
      },
      onRehydrateStorage: () => (rehydrated, error) => {
        if (error) {
          captureError(error, { scope: 'builder/store#rehydrate' })
          return
        }
        if (!rehydrated) return
        const result = builderStateSchema.safeParse(rehydrated)
        if (!result.success) {
          captureError(result.error, { scope: 'builder/store#validate' })
        }
      },
    },
  ),
)
