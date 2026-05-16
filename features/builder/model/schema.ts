/**
 * Единая Zod-схема состояния конструктора. Из неё выводятся типы (z.infer)
 * и проверяется JSON, восстанавливаемый из localStorage.
 */
import { z } from 'zod'

export const scriptKindSchema = z.enum([
  'jsScriptFinishSend',
  'jsScriptItemType',
  'jsScriptHttpHandler',
  'jsScriptHistorySensor',
  'jsScriptAuthMode',
  'jsScriptAction',
  'InfoscanPage',
  'ScriptScheduler',
])

export const targetSystemSchema = z.enum([
  '1c',
  'solvo',
  'axelot',
  'manhattan',
  'magnit',
  'jetloader',
  'bpm',
  'custom',
  'other',
])

export const transportSchema = z.enum([
  'http',
  'httpOauth',
  'tcp',
  'ftp',
  'ftps',
  'ftpes',
  'sftp',
  'file',
  'qr',
  'simple',
  'ftpCapture',
  'fileCapture',
  'ftpsCapture',
  'ftpesCapture',
  'sftpCapture',
])

export const bodyFormatSchema = z.enum(['json', 'xml', 'csv', 'custom'])

export const authKindSchema = z.enum(['none', 'basic', 'bearer', 'oauth2'])

export const targetModelSchema = z.enum(['infoscan-3d-60', 'infoscan-3d-90', 'infoscan-camera'])

export const fieldMappingSchema = z.object({
  /** Имя поля целевой системы (Width, weight_g и т.п.) */
  targetField: z.string().min(1, 'Имя поля не должно быть пустым'),
  /** Имя переменной среды или выражение (SENSOR.weightFormat, BARCODE, args.resultItemTypeCount) */
  source: z.string().min(1, 'Источник не может быть пустым'),
})

export const builderStateSchema = z.object({
  step: z.number().int().min(1).max(6).default(1),
  /** Шаг 1 */
  scriptKind: scriptKindSchema.default('jsScriptFinishSend'),
  /** Целевая модель устройства (нужна для выбора lengthFormat vs depthFormat) */
  targetModel: targetModelSchema.default('infoscan-3d-90'),
  /** Шаг 2 */
  targetSystem: targetSystemSchema.default('1c'),
  /** Шаг 3 */
  transport: transportSchema.default('http'),
  /** Шаг 4 */
  bodyFormat: bodyFormatSchema.default('json'),
  fields: z.array(fieldMappingSchema).default([]),
  customBodyTemplate: z.string().default(''),
  /** Шаг 5 */
  endpointUrl: z.string().default(''),
  authKind: authKindSchema.default('none'),
  authLogin: z.string().default(''),
  authPassword: z.string().default(''),
  bearerToken: z.string().default(''),
  oauthUrl: z.string().default(''),
  oauthClientId: z.string().default(''),
  oauthClientSecret: z.string().default(''),
  customHeaders: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  /** Шаг 6 */
  successStatusField: z.string().default('status'),
  successStatusValue: z.string().default('OK'),
  errorMessage: z.string().default('Ошибка отправки данных'),
  successBanner: z.string().default('Успешно записано'),
})

export type BuilderState = z.infer<typeof builderStateSchema>
export type ScriptKind = z.infer<typeof scriptKindSchema>
export type TargetSystem = z.infer<typeof targetSystemSchema>
export type Transport = z.infer<typeof transportSchema>
export type BodyFormat = z.infer<typeof bodyFormatSchema>
export type AuthKind = z.infer<typeof authKindSchema>
export type TargetModel = z.infer<typeof targetModelSchema>
export type FieldMapping = z.infer<typeof fieldMappingSchema>

export const TOTAL_STEPS = 6 as const
