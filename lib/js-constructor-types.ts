/**
 * Типы данных для JS-конструктора шаблонов.
 * ParamDef и StageDef хранятся как JSON в БД.
 */

export type ParamType = 'text' | 'number' | 'textarea' | 'select' | 'toggle' | 'url' | 'password'

export interface ParamDef {
  key: string
  label: string
  type: ParamType
  required?: boolean
  defaultValue?: string
  hint?: string
  /** Для type=select: варианты [{label,value}] */
  options?: Array<{ label: string; value: string }>
}

export interface StageDef {
  id: string
  title: string
  description?: string
  fields: ParamDef[]
}

/** Шаблон из БД, десериализованный */
export interface JsTemplateData {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  version: string
  code: string
  params: ParamDef[]
  stages: StageDef[]
  compatibleWith: string[]
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Конфигурация из БД, десериализованная */
export interface JsConfigData {
  id: string
  slug: string
  name: string
  description: string | null
  clientName: string | null
  templateIds: string[]
  /** {[toTemplateId]: {[toParamKey]: "fromTemplateId.fromParamKey"}} */
  connections: Record<string, Record<string, string>>
  /** {[templateId]: {[paramKey]: string}} */
  values: Record<string, Record<string, string>>
  generatedCode: string
  createdById: string | null
  createdAt: string
  updatedAt: string
  templates?: JsTemplateData[]
}

/** Состояние мастера сборки */
export interface WizardState {
  selectedIds: string[] // упорядоченный список id шаблонов
  connections: JsConfigData['connections']
  values: JsConfigData['values']
  name: string
  description: string
  clientName: string
}

export const EMPTY_WIZARD_STATE: WizardState = {
  selectedIds: [],
  connections: {},
  values: {},
  name: '',
  description: '',
  clientName: '',
}

/** Генерация итогового JS-кода из шаблонов + значений + связей */
export function generateCode(
  templates: JsTemplateData[],
  values: WizardState['values'],
  connections: WizardState['connections'],
): string {
  return templates
    .map((t) => {
      let code = t.code
      const tValues = values[t.id] ?? {}
      const tConnections = connections[t.id] ?? {}

      // Сначала применяем связи (значения из других шаблонов)
      for (const [toKey, fromRef] of Object.entries(tConnections)) {
        const parts = fromRef.split('.')
        const fromTemplateId = parts[0]
        const fromKey = parts[1]
        if (!fromTemplateId || !fromKey) continue
        const sourceVal = values[fromTemplateId]?.[fromKey] ?? ''
        code = code.replaceAll(`{{${toKey}}}`, sourceVal)
      }

      // Затем локальные значения
      for (const [key, val] of Object.entries(tValues)) {
        code = code.replaceAll(`{{${key}}}`, val)
      }

      // Дефолтные значения для незаполненных
      for (const param of [...t.params, ...t.stages.flatMap((s) => s.fields)]) {
        if (param.defaultValue !== undefined && param.defaultValue !== null) {
          code = code.replaceAll(`{{${param.key}}}`, param.defaultValue)
        }
      }

      return `// === ${t.name} (v${t.version}) ===\n${code}`
    })
    .join('\n\n')
}
