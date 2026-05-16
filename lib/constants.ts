/**
 * Единый источник правды по продукту.
 * Все факты — модели, версии, диапазоны, переменные среды шаблонов,
 * транспорты, типы Item Type, контакты — живут только здесь.
 * Никаких дублирующих списков в компонентах или в content/.
 */

// ---- Модельный ряд ----

export type ModelId = 'infoscan-3d-60' | 'infoscan-3d-90' | 'infoscan-camera'
export type VersionId = 'lite' | 'pro'

export interface Model {
  id: ModelId
  shortName: string
  fullName: string
  technology: 'laser' | 'camera-3d'
  /** Диапазон ВГХ в мм: [min, max] */
  dimensionRange: { width: [number, number]; height: [number, number]; length: [number, number] }
  /** Погрешность измерения габаритов */
  dimensionAccuracy: string
  /** Диапазон массы в кг */
  weightRange: [number, number]
  /** Погрешность массы */
  weightAccuracy: string
  /** Модуль взвешивания (модель весов МАССА-К) */
  scaleModule: string
  /** Скорость измерения */
  measurementSpeed: string
  /** Габариты устройства Д×Ш×В в мм */
  deviceSize: { length: number; width: number; height: number }
  /** Вес устройства в кг */
  deviceWeight: number
  /** Питание */
  power: string
  /** Диапазон температур */
  temperatureRange: string
  /** Имя переменной длины в SENSOR (важно: у Camera оно другое) */
  lengthVariable: 'SENSOR.lengthFormat' | 'SENSOR.depthFormat'
}

export const MODELS: readonly Model[] = [
  {
    id: 'infoscan-3d-60',
    shortName: '3D 60',
    fullName: 'Инфоскан 3D 60',
    technology: 'laser',
    dimensionRange: { width: [20, 600], height: [20, 600], length: [20, 600] },
    dimensionAccuracy: '±3 мм',
    weightRange: [0.02, 50],
    weightAccuracy: '±0,01 кг',
    scaleModule: 'TB-S-32.2',
    measurementSpeed: '1–2 сек',
    deviceSize: { length: 1300, width: 760, height: 840 },
    deviceWeight: 25,
    power: '12 V / 220 V',
    temperatureRange: 'от +5 °C до +40 °C',
    lengthVariable: 'SENSOR.lengthFormat',
  },
  {
    id: 'infoscan-3d-90',
    shortName: '3D 90',
    fullName: 'Инфоскан 3D 90',
    technology: 'laser',
    dimensionRange: { width: [20, 850], height: [20, 850], length: [20, 850] },
    dimensionAccuracy: '±3 мм',
    weightRange: [0.02, 50],
    weightAccuracy: '±0,01 кг',
    scaleModule: 'TB-S-60.2',
    measurementSpeed: '1–2 сек',
    deviceSize: { length: 950, width: 950, height: 1050 },
    deviceWeight: 20,
    power: '5 V / 220 V',
    temperatureRange: 'от +5 °C до +40 °C',
    lengthVariable: 'SENSOR.lengthFormat',
  },
  {
    id: 'infoscan-camera',
    shortName: 'Camera',
    fullName: 'Инфоскан Camera',
    technology: 'camera-3d',
    dimensionRange: { width: [20, 600], height: [20, 900], length: [20, 600] },
    dimensionAccuracy: '±5–20 мм',
    weightRange: [0.02, 50],
    weightAccuracy: '±0,01 кг',
    scaleModule: 'TB-M',
    measurementSpeed: '1–2 сек',
    deviceSize: { length: 600, width: 800, height: 1500 },
    deviceWeight: 23,
    power: '5 V / 220 V',
    temperatureRange: 'от +5 °C до +40 °C',
    lengthVariable: 'SENSOR.depthFormat',
  },
] as const

export interface Version {
  id: VersionId
  name: string
  ethernet: boolean
  wifi: boolean
  usb: boolean
  display: string | false
}

export const VERSIONS: readonly Version[] = [
  { id: 'lite', name: 'LITE', ethernet: false, wifi: false, usb: true, display: false },
  { id: 'pro', name: 'PRO', ethernet: true, wifi: true, usb: true, display: '7", сенсорный' },
] as const

// ---- Переменные среды JS-шаблонов ----

export type ScopeKind = 'global' | 'sensor' | 'helper' | 'dynamic'

export interface TemplateVariable {
  name: string
  scope: ScopeKind
  type: string
  description: string
  /** Для какой модели применима. undefined — для всех. */
  modelSpecific?: ModelId[]
  example?: string
}

export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  {
    name: 'BARCODE',
    scope: 'global',
    type: 'string',
    description: 'Основной штрих-код объекта (последний считанный).',
    example: '"4607062470015"',
  },
  {
    name: 'ADDITIONAL_BARCODES',
    scope: 'global',
    type: 'string[]',
    description: 'Массив дополнительных ШК, считанных в процессе Item Type.',
    example: '["A1", "B2"]',
  },
  {
    name: 'DEV_CODE',
    scope: 'global',
    type: 'string',
    description: 'Уникальный код устройства.',
    example: '"INF-3D90-00042"',
  },
  {
    name: 'UNIQUE_INDEX_HISTORY',
    scope: 'global',
    type: 'number',
    description: 'Уникальный индекс измерения в истории устройства.',
  },
  {
    name: 'SENSOR.widthFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Ширина объекта в отформатированном виде (единицы — DistanceType из настроек).',
  },
  {
    name: 'SENSOR.heightFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Высота объекта (отформатированная).',
  },
  {
    name: 'SENSOR.lengthFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Длина (глубина) объекта для лазерных моделей 3D 60 / 3D 90.',
    modelSpecific: ['infoscan-3d-60', 'infoscan-3d-90'],
  },
  {
    name: 'SENSOR.depthFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Длина (глубина) объекта для модели Camera. Внимание: имя отличается от 3D!',
    modelSpecific: ['infoscan-camera'],
  },
  {
    name: 'SENSOR.weightFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Масса (отформатированная, единицы — WeightType).',
  },
  {
    name: 'SENSOR.volumeFormat',
    scope: 'sensor',
    type: 'string',
    description: 'Объём (отформатированный, единицы — VolumeType).',
  },
  {
    name: 'HELPER_JS.toBase64',
    scope: 'helper',
    type: '(str: string) => string',
    description: 'Кодирует строку в Base64. Часто нужно для Basic-авторизации.',
    example: "'Basic ' + HELPER_JS.toBase64('login:password')",
  },
  {
    name: 'HELPER_JS.xmlToJson',
    scope: 'helper',
    type: '(xml: string) => string',
    description: 'Парсит XML/SOAP ответ в JSON-строку.',
  },
  {
    name: 'HELPER_JS.xmlXPath',
    scope: 'helper',
    type: '(xml: string, path: string) => string',
    description: 'XPath по XML/SOAP ответу.',
    example: "HELPER_JS.xmlXPath(resp, '/Detail/code/text()')",
  },
  {
    name: 'GLOBAL_VAR.store',
    scope: 'helper',
    type: 'object',
    description: 'Локальное хранилище в памяти устройства (storeGet / storePut / storeRemove).',
  },
  {
    name: 'GLOBAL_VAR.storeScheduler',
    scope: 'helper',
    type: 'object',
    description: 'Хранилище на диске для Script Scheduler.',
  },
  {
    name: 'args.resultXxx',
    scope: 'dynamic',
    type: 'any',
    description: 'Результаты выбранных Item Type-шагов (имена задаются в шаблоне).',
    example: 'args.resultItemTypeCount, args.resultListButtonRowPage.value',
  },
] as const

// ---- Транспорты Finish Send ----

export type TransportId =
  | 'http'
  | 'httpOauth'
  | 'tcp'
  | 'ftp'
  | 'ftps'
  | 'ftpes'
  | 'sftp'
  | 'file'
  | 'qr'
  | 'simple'
  | 'ftpCapture'
  | 'fileCapture'
  | 'ftpsCapture'
  | 'ftpesCapture'
  | 'sftpCapture'

export interface Transport {
  id: TransportId
  name: string
  group: 'http' | 'tcp' | 'file' | 'screen' | 'capture'
  description: string
  /** Шаги, которые добавляются в мастере для этого транспорта */
  needsUrl: boolean
  needsCredentials: boolean
  isCapture: boolean
}

export const TRANSPORTS: readonly Transport[] = [
  {
    id: 'http',
    name: 'HTTP (POST)',
    group: 'http',
    description: 'REST / Webhook / SOAP — всё это HTTP POST с разным Content-Type и body.',
    needsUrl: true,
    needsCredentials: false,
    isCapture: false,
  },
  {
    id: 'httpOauth',
    name: 'HTTP + OAuth 2.0',
    group: 'http',
    description: 'POST с автоматической подстановкой Bearer-токена. Токен кешируется по auth.url.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: false,
  },
  {
    id: 'tcp',
    name: 'Raw TCP',
    group: 'tcp',
    description: 'Сырой TCP-сокет — для legacy-WMS с собственным бинарным протоколом.',
    needsUrl: true,
    needsCredentials: false,
    isCapture: false,
  },
  {
    id: 'ftp',
    name: 'FTP',
    group: 'file',
    description: 'Файловый обмен без TLS.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: false,
  },
  {
    id: 'ftps',
    name: 'FTPS (implicit)',
    group: 'file',
    description: 'FTP с шифрованием с самого начала соединения.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: false,
  },
  {
    id: 'ftpes',
    name: 'FTPES (explicit)',
    group: 'file',
    description: 'FTP с переключением в TLS по команде AUTH TLS.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: false,
  },
  {
    id: 'sftp',
    name: 'SFTP (SSH)',
    group: 'file',
    description: 'Файловая передача поверх SSH.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: false,
  },
  {
    id: 'file',
    name: 'Локальный файл',
    group: 'file',
    description: 'Запись в файл на устройстве (с append) — для последующего забора.',
    needsUrl: false,
    needsCredentials: false,
    isCapture: false,
  },
  {
    id: 'qr',
    name: 'QR на экран',
    group: 'screen',
    description: 'Только вывод QR-кода на экран устройства, без передачи в сеть.',
    needsUrl: false,
    needsCredentials: false,
    isCapture: false,
  },
  {
    id: 'simple',
    name: 'Только баннер',
    group: 'screen',
    description: 'Только баннер на экране — для тестов и сценариев без отправки.',
    needsUrl: false,
    needsCredentials: false,
    isCapture: false,
  },
  {
    id: 'ftpCapture',
    name: 'FTP + кадр камеры',
    group: 'capture',
    description: 'Отправка кадра с веб-камеры на FTP с подписью.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: true,
  },
  {
    id: 'fileCapture',
    name: 'Файл + кадр камеры',
    group: 'capture',
    description: 'Сохранение кадра с веб-камеры в локальный файл.',
    needsUrl: false,
    needsCredentials: false,
    isCapture: true,
  },
  {
    id: 'ftpsCapture',
    name: 'FTPS + кадр камеры',
    group: 'capture',
    description: 'Кадр с веб-камеры на FTPS-сервер.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: true,
  },
  {
    id: 'ftpesCapture',
    name: 'FTPES + кадр камеры',
    group: 'capture',
    description: 'Кадр с веб-камеры на FTPES-сервер.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: true,
  },
  {
    id: 'sftpCapture',
    name: 'SFTP + кадр камеры',
    group: 'capture',
    description: 'Кадр с веб-камеры на SFTP-сервер.',
    needsUrl: true,
    needsCredentials: true,
    isCapture: true,
  },
] as const

// ---- Item Type страницы ----

export type ItemTypePageId =
  | 'ListButtonPage'
  | 'ListButtonRowPage'
  | 'CountPage'
  | 'AdditionalScanPage'
  | 'ConfirmBarcodePage'
  | 'InfoScanLitePage'
  | 'InfoScanLiteItemTypePage'

export interface ItemTypePage {
  id: ItemTypePageId
  name: string
  purpose: string
}

export const ITEM_TYPE_PAGES: readonly ItemTypePage[] = [
  {
    id: 'ListButtonPage',
    name: 'ListButtonPage',
    purpose: 'Список кнопок вертикальный. Подходит для длинных списков типов.',
  },
  {
    id: 'ListButtonRowPage',
    name: 'ListButtonRowPage',
    purpose: 'Кнопки в ряд (горизонтально). 2–4 варианта типа упаковки.',
  },
  {
    id: 'CountPage',
    name: 'CountPage',
    purpose: 'Ввод числа (количество, доп. параметр).',
  },
  {
    id: 'AdditionalScanPage',
    name: 'AdditionalScanPage',
    purpose: 'Сканирование дополнительного ШК.',
  },
  {
    id: 'ConfirmBarcodePage',
    name: 'ConfirmBarcodePage',
    purpose: 'Подтверждение наименования товара (с HTTP-запросом к WMS).',
  },
  {
    id: 'InfoScanLiteItemTypePage',
    name: 'InfoScanLiteItemTypePage',
    purpose: 'Главный экран измерения, привязанный к выбранному типу.',
  },
  {
    id: 'InfoScanLitePage',
    name: 'InfoScanLitePage',
    purpose: 'Выход из Item Type, возврат в обычный главный экран.',
  },
] as const

// ---- Шаблоны (раздел «Алгоритмы») ----

export type ScriptKind =
  | 'jsScriptItemType'
  | 'jsScriptFinishSend'
  | 'jsScriptHttpHandler'
  | 'jsScriptHistorySensor'
  | 'jsScriptAuthMode'
  | 'jsScriptAction'
  | 'InfoscanPage'
  | 'ScriptScheduler'

export interface ScriptTemplate {
  id: ScriptKind
  name: string
  purpose: string
}

export const SCRIPT_TEMPLATES: readonly ScriptTemplate[] = [
  {
    id: 'jsScriptFinishSend',
    name: 'Finish Send',
    purpose: 'Отправка результатов после успешного измерения.',
  },
  {
    id: 'jsScriptItemType',
    name: 'Item Type',
    purpose: 'Дополнительные экраны до измерения.',
  },
  {
    id: 'jsScriptHttpHandler',
    name: 'HTTP Handler',
    purpose: 'HTTP-обработчик: получение данных по ШК и т.п.',
  },
  {
    id: 'jsScriptHistorySensor',
    name: 'History Sensor',
    purpose: 'Структурирование данных истории измерений.',
  },
  {
    id: 'jsScriptAuthMode',
    name: 'Auth Mode',
    purpose: 'Режим авторизации сотрудника.',
  },
  {
    id: 'jsScriptAction',
    name: 'Action',
    purpose: 'Действия и кнопки на устройстве.',
  },
  {
    id: 'InfoscanPage',
    name: 'Infoscan Page',
    purpose: 'Конфигурация главного экрана.',
  },
  {
    id: 'ScriptScheduler',
    name: 'Script Scheduler',
    purpose: 'Выполнение скриптов по расписанию.',
  },
] as const

// ---- Аудитория ----

export type Audience = 'operator' | 'admin' | 'developer'

export interface AudienceConfig {
  id: Audience
  label: string
  emoji: string
  color: string
  cssVar: string
  description: string
}

export const AUDIENCES: readonly AudienceConfig[] = [
  {
    id: 'operator',
    label: 'Оператор',
    emoji: '🟡',
    color: 'amber',
    cssVar: '--color-yellow-brand',
    description: 'Кладовщик / сотрудник склада, производства, сортировочного центра.',
  },
  {
    id: 'admin',
    label: 'Админ',
    emoji: '🔵',
    color: 'blue',
    cssVar: '--color-info',
    description: 'ИТ-администратор или механик склада.',
  },
  {
    id: 'developer',
    label: 'Разработчик',
    emoji: '🟢',
    color: 'green',
    cssVar: '--color-success',
    description: 'Интегратор WMS на стороне клиента или партнёра.',
  },
] as const

// ---- Контакты и реквизиты ----

export const COMPANY = {
  legalName: 'ООО «Инфотех»',
  brandName: 'Инфотех',
  sinceYear: 2015,
  email: 'sales@inf-tec.ru',
  phone: '+7 (495) 995 59 13',
  telegram: '@kazartsevk',
  telegramUrl: 'https://t.me/kazartsevk',
  metrologicalCertificate: '№ 83617-21',
  website: 'https://inf-tec.ru',
} as const

// ---- Разделы информационной архитектуры ----

export interface Section {
  id: string
  order: number
  title: string
  audience?: Audience[]
}

export const SECTIONS: readonly Section[] = [
  { id: '01-start', order: 1, title: 'Начало' },
  { id: '02-assembly', order: 2, title: 'Сборка устройства', audience: ['admin'] },
  { id: '03-network', order: 3, title: 'Подключение и сеть', audience: ['admin'] },
  { id: '04-operation', order: 4, title: 'Эксплуатация', audience: ['operator'] },
  { id: '05-configuration', order: 5, title: 'Настройка', audience: ['admin'] },
  { id: '06-integration', order: 6, title: 'Интеграция', audience: ['developer'] },
  { id: '07-service', order: 7, title: 'Регламенты и сервис', audience: ['admin'] },
  {
    id: '08-troubleshooting',
    order: 8,
    title: 'Диагностика и FAQ',
    audience: ['operator', 'admin', 'developer'],
  },
  { id: '09-ecosystem', order: 9, title: 'Экосистема СУРС' },
  { id: '10-reference', order: 10, title: 'Справочники' },
] as const

// ---- Сайт ----

export const SITE = {
  name: 'База знаний Инфоскан',
  description:
    'Документация и интерактивные инструменты для устройств измерения габаритов и веса Инфоскан (3D 60 / 3D 90 / Camera).',
  defaultLocale: 'ru-RU' as const,
  htmlLang: 'ru' as const,
  titleSuffix: 'База знаний Инфоскан',
} as const
