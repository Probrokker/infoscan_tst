/**
 * Машина состояний эмулятора. Все экраны и допустимые переходы перечислены
 * в одном месте — это даёт читаемость и тестируемость без XState.
 *
 * Переходы валидируются: если в текущем состоянии переход не разрешён,
 * dispatch возвращает текущее состояние и пишет console.warn в dev.
 */

export type ScreenId =
  | 'loading'
  | 'auth' // авторизация сотрудника по ШК
  | 'pinPad' // ввод PIN при входе в настройки
  | 'pinError'
  | 'main'
  | 'settingsMenu'
  | 'networkSettings'
  | 'calibrationLaser'
  | 'calibrationWeight'
  | 'history'
  | 'itemTypeList' // ListButtonRowPage
  | 'itemTypeCount' // CountPage
  | 'itemTypeConfirm' // ConfirmBarcodePage
  | 'measurementError'

export type Event =
  | { type: 'BOOT_DONE' }
  | { type: 'AUTH_SCAN' }
  | { type: 'GO_SETTINGS' }
  | { type: 'PIN_OK' }
  | { type: 'PIN_FAIL' }
  | { type: 'PIN_RESET' }
  | { type: 'GO_NETWORK' }
  | { type: 'GO_CAL_LASER' }
  | { type: 'GO_CAL_WEIGHT' }
  | { type: 'GO_HISTORY' }
  | { type: 'BACK_TO_MAIN' }
  | { type: 'BACK_TO_SETTINGS' }
  | { type: 'ITEM_TYPE_OPEN' }
  | { type: 'ITEM_TYPE_PICK' }
  | { type: 'ITEM_TYPE_COUNT_OK' }
  | { type: 'ITEM_TYPE_CONFIRM' }
  | { type: 'MEASURE_OK' }
  | { type: 'MEASURE_FAIL' }
  | { type: 'RETRY_MEASURE' }

export interface Transition {
  from: ScreenId
  event: Event['type']
  to: ScreenId
}

export const TRANSITIONS: readonly Transition[] = [
  { from: 'loading', event: 'BOOT_DONE', to: 'main' },
  { from: 'loading', event: 'AUTH_SCAN', to: 'auth' },
  { from: 'auth', event: 'AUTH_SCAN', to: 'main' },

  { from: 'main', event: 'GO_SETTINGS', to: 'pinPad' },
  { from: 'main', event: 'GO_HISTORY', to: 'history' },
  { from: 'main', event: 'ITEM_TYPE_OPEN', to: 'itemTypeList' },
  { from: 'main', event: 'MEASURE_FAIL', to: 'measurementError' },

  { from: 'pinPad', event: 'PIN_OK', to: 'settingsMenu' },
  { from: 'pinPad', event: 'PIN_FAIL', to: 'pinError' },
  { from: 'pinPad', event: 'BACK_TO_MAIN', to: 'main' },
  { from: 'pinError', event: 'PIN_RESET', to: 'pinPad' },
  { from: 'pinError', event: 'BACK_TO_MAIN', to: 'main' },

  { from: 'settingsMenu', event: 'GO_NETWORK', to: 'networkSettings' },
  { from: 'settingsMenu', event: 'GO_CAL_LASER', to: 'calibrationLaser' },
  { from: 'settingsMenu', event: 'GO_CAL_WEIGHT', to: 'calibrationWeight' },
  { from: 'settingsMenu', event: 'BACK_TO_MAIN', to: 'main' },

  { from: 'networkSettings', event: 'BACK_TO_SETTINGS', to: 'settingsMenu' },
  { from: 'calibrationLaser', event: 'BACK_TO_SETTINGS', to: 'settingsMenu' },
  { from: 'calibrationWeight', event: 'BACK_TO_SETTINGS', to: 'settingsMenu' },

  { from: 'history', event: 'BACK_TO_MAIN', to: 'main' },

  { from: 'itemTypeList', event: 'ITEM_TYPE_PICK', to: 'itemTypeCount' },
  { from: 'itemTypeList', event: 'BACK_TO_MAIN', to: 'main' },
  { from: 'itemTypeCount', event: 'ITEM_TYPE_COUNT_OK', to: 'itemTypeConfirm' },
  { from: 'itemTypeCount', event: 'BACK_TO_MAIN', to: 'main' },
  { from: 'itemTypeConfirm', event: 'ITEM_TYPE_CONFIRM', to: 'main' },
  { from: 'itemTypeConfirm', event: 'BACK_TO_MAIN', to: 'main' },

  { from: 'measurementError', event: 'RETRY_MEASURE', to: 'main' },
  { from: 'measurementError', event: 'BACK_TO_MAIN', to: 'main' },
]

export const SCREEN_TITLES: Record<ScreenId, string> = {
  loading: 'Загрузка',
  auth: 'Авторизация по ШК',
  pinPad: 'Ввод PIN',
  pinError: 'Неверный PIN',
  main: 'Главный экран',
  settingsMenu: 'Меню настроек',
  networkSettings: 'Настройки сети',
  calibrationLaser: 'Калибровка ЛД',
  calibrationWeight: 'Калибровка ВД',
  history: 'История измерений',
  itemTypeList: 'Item Type: тип упаковки',
  itemTypeCount: 'Item Type: количество',
  itemTypeConfirm: 'Подтвердите ШК',
  measurementError: 'Ошибка измерения',
}

/**
 * Чисто-функциональный reducer. Состояние не мутируется.
 * Если перехода нет — возвращаем прежний экран.
 */
export function transition(current: ScreenId, event: Event): ScreenId {
  const rule = TRANSITIONS.find((t) => t.from === current && t.event === event.type)
  if (!rule) {
    if (process.env['NODE_ENV'] !== 'production') {
      console.warn('[emulator] Недопустимый переход:', current, '->', event.type)
    }
    return current
  }
  return rule.to
}

export function allowedEvents(current: ScreenId): Array<Event['type']> {
  return TRANSITIONS.filter((t) => t.from === current).map((t) => t.event)
}
