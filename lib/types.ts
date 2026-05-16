/**
 * Общие типы, не привязанные к конкретной фиче.
 */
export type {
  Audience,
  ModelId,
  VersionId,
  TransportId,
  ItemTypePageId,
  ScriptKind,
} from '@/lib/constants'
export type { DocPage, Frontmatter, SidebarNode } from '@/lib/content'

/** Утилиты типов */
export type Nullable<T> = T | null
export type ValueOf<T> = T[keyof T]
