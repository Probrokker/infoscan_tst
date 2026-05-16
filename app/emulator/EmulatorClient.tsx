'use client'

import dynamic from 'next/dynamic'

const EmulatorApp = dynamic(
  () => import('@/features/emulator').then((m) => ({ default: m.EmulatorApp })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6">
        <div className="text-sm text-[var(--muted-foreground)]">Загрузка эмулятора…</div>
      </div>
    ),
  },
)

export function EmulatorClient() {
  return <EmulatorApp />
}
