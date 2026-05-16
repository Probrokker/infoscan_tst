'use client'

/**
 * Визуальная "рамка" устройства — стилизованный корпус 7" дисплея Инфоскана.
 * Внутрь подаётся экран.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export function DeviceFrame({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <div className={cn('flex justify-center', className)}>
      <div className="relative" aria-label={title}>
        {/* Корпус */}
        <div className="rounded-[24px] bg-zinc-800 p-3 shadow-2xl dark:bg-zinc-950">
          {/* Рамка экрана */}
          <div className="overflow-hidden rounded-[16px] border-4 border-zinc-700 bg-white dark:border-zinc-800">
            <div className="aspect-[16/10] w-[560px] max-w-full bg-white text-zinc-900 sm:w-[640px]">
              {children}
            </div>
          </div>
          {/* Логотип под экраном */}
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400">
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-yellow-brand)] text-zinc-900"
            >
              И
            </span>
            ИНФОСКАН
          </div>
        </div>
      </div>
    </div>
  )
}
