import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Начало',
  description: 'Что такое Инфоскан, сравнение моделей, глоссарий',
}

const ARTICLES = [{'slug': 'compare-models', 'title': 'Сравнение моделей', 'desc': '3D 60, 3D 90 и Camera — какие задачи решает каждая, в чём отличия LITE и PRO'}, {'slug': 'glossary', 'title': 'Глоссарий', 'desc': 'Расшифровка терминов: СУРС, ВГХ, ЛД, ВД, Item Type, Алгоритмы, метрологический сертификат'}, {'slug': 'what-is-infoscan', 'title': 'Что такое Инфоскан', 'desc': 'Линейка устройств автоматического измерения габаритов и веса груза за 1–2 секунды'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Начало</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Что такое Инфоскан, сравнение моделей, глоссарий</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/01-start/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <h2 className="font-medium">{a.title}</h2>
                {a.desc && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{a.desc}</p>}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
