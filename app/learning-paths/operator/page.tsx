import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Маршрут «Оператор» — 15 минут',
  description: 'Учебная дорожка для кладовщика и сотрудника склада',
}

const STEPS = [
  { slug: '01-start/what-is-infoscan', title: 'Что такое Инфоскан', desc: 'Зачем нужно устройство' },
  { slug: '04-operation/startup', title: 'Включение и проверка', desc: 'Первый запуск устройства' },
  { slug: '04-operation/main-screen', title: 'Главный экран', desc: 'Что где и для чего' },
  { slug: '04-operation/measure-regular', title: 'Измерение за 3 шага', desc: 'Базовый сценарий' },
  { slug: '04-operation/measure-irregular', title: 'Неправильные формы', desc: 'Мешки, конверты, мягкие упаковки' },
  { slug: '04-operation/history', title: 'История измерений', desc: 'Где смотреть прошлые замеры' },
  { slug: '04-operation/errors', title: 'Что делать при ошибке', desc: 'Алгоритм действий' },
]

export default function OperatorPath() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Учебная дорожка</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Маршрут оператора</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">За 15 минут научитесь измерять груз на Инфоскане и решать частые ошибки.</p>
      </header>
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/${s.slug}`} className="flex items-start gap-4 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-yellow-brand)] font-mono text-sm font-semibold text-[var(--color-black-brand)]">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{s.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.desc}</p>
              </div>
              <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
