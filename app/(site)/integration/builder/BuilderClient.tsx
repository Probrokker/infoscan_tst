'use client'

import dynamic from 'next/dynamic'
import { Wrench } from 'lucide-react'

const BuilderApp = dynamic(
  () => import('@/features/builder').then((m) => ({ default: m.BuilderApp })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <Wrench className="h-5 w-5 animate-pulse" strokeWidth={1.5} aria-hidden />
          Загрузка конструктора…
        </div>
      </div>
    ),
  },
)

export function BuilderClient() {
  return <BuilderApp />
}
