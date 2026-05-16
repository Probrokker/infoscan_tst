/**
 * Публичный API фичи builder. Импортировать конструктор только отсюда —
 * чтобы соблюдать feature-sliced ограничения (ESLint: no-restricted-imports
 * для прямых импортов из ui/model/lib извне).
 */
export { BuilderApp } from './ui/BuilderApp'
export { useBuilderStore } from './model/store'
export { generateScript, generateCurl, generateDocumentation } from './lib/generator'
export type { BuilderState, ScriptKind, Transport, BodyFormat, TargetModel } from './model/schema'
