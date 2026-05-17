'use client'

import { ArticleStatus as PrismaStatus } from '@prisma/client'

const OPTIONS = [
  { value: 'OPERATOR', label: 'Оператор' },
  { value: 'ADMIN_AUDIENCE', label: 'Администратор' },
  { value: 'DEVELOPER', label: 'Разработчик' },
] as const

export function AudienceCheckboxes({ defaultValues }: { defaultValues?: string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {OPTIONS.map((o) => (
        <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            name="audience"
            value={o.value}
            defaultChecked={defaultValues?.includes(o.value)}
            className="h-4 w-4 rounded accent-[var(--color-yellow-brand)]"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

const STATUS_LABEL: Record<PrismaStatus, string> = {
  [PrismaStatus.DRAFT]: 'Черновик',
  [PrismaStatus.PUBLISHED]: 'Опубликовано',
  [PrismaStatus.ARCHIVED]: 'Архив',
}

export { STATUS_LABEL }
