import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Эмулятор устройства',
  description:
    'Симуляция экранов и измерений Инфоскана. Проверяет JS-шаблон из конструктора в изолированной песочнице — реальная отправка в сеть отключена.',
}

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

export default function EmulatorPage() {
  return <EmulatorApp />
}
