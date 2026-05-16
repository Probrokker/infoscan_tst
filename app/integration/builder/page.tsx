/**
 * Страница /integration/builder.
 * Сама фича — клиентский компонент с тяжёлым состоянием в Zustand,
 * поэтому подключаем её через next/dynamic с ssr: false: до загрузки JS
 * пользователь увидит skeleton, после — полноценный мастер.
 */
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Конструктор JS-шаблона',
  description:
    'Соберите JavaScript-шаблон для раздела «Алгоритмы» Личного кабинета устройства Инфоскан за 6 шагов. На выходе — готовый код плюс cURL для теста и Markdown с инструкциями для интегратора.',
}

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

export default function BuilderPage() {
  return <BuilderApp />
}
