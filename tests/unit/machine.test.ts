/**
 * Тесты машины состояний эмулятора. Чистые функции — идеально для юнитов.
 */
import { describe, it, expect } from 'vitest'
import { transition, TRANSITIONS, allowedEvents } from '@/features/emulator/model/machine'

describe('emulator state machine', () => {
  it('переходит из loading в main по BOOT_DONE', () => {
    expect(transition('loading', { type: 'BOOT_DONE' })).toBe('main')
  })

  it('переходит из main в pinPad по GO_SETTINGS', () => {
    expect(transition('main', { type: 'GO_SETTINGS' })).toBe('pinPad')
  })

  it('полный путь Item Type', () => {
    let state = transition('main', { type: 'ITEM_TYPE_OPEN' })
    expect(state).toBe('itemTypeList')
    state = transition(state, { type: 'ITEM_TYPE_PICK' })
    expect(state).toBe('itemTypeCount')
    state = transition(state, { type: 'ITEM_TYPE_COUNT_OK' })
    expect(state).toBe('itemTypeConfirm')
    state = transition(state, { type: 'ITEM_TYPE_CONFIRM' })
    expect(state).toBe('main')
  })

  it('игнорирует недопустимые переходы', () => {
    expect(transition('main', { type: 'PIN_OK' })).toBe('main')
    expect(transition('loading', { type: 'GO_SETTINGS' })).toBe('loading')
  })

  it('у каждого экрана определены допустимые события', () => {
    expect(allowedEvents('main').length).toBeGreaterThan(0)
    expect(allowedEvents('loading').length).toBeGreaterThan(0)
  })

  it('все переходы — уникальные комбинации from+event', () => {
    const keys = TRANSITIONS.map((t) => `${t.from}::${t.event}`)
    const uniq = new Set(keys)
    expect(uniq.size).toBe(keys.length)
  })
})
