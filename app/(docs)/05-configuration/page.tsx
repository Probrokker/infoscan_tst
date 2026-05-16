import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Настройка',
  description: 'Калибровка датчиков, Личный кабинет, обновление прошивки',
}

const ARTICLES = [{'slug': 'algorithms', 'title': 'Раздел «Алгоритмы» — загрузка JS-шаблонов', 'desc': 'Как загружать шаблоны в Личный кабинет устройства, сохранять, тестировать'}, {'slug': 'calibration-laser', 'title': 'Калибровка лазерных датчиков', 'desc': 'Кубик 20×20×20 мм, винты H1.5, проверка направления лучей'}, {'slug': 'calibration-weight', 'title': 'Калибровка весового датчика', 'desc': 'Гиря 20–40 кг, ввод фактической массы, проверка точности'}, {'slug': 'firmware', 'title': 'Обновление прошивки', 'desc': 'Прошивка через microSD-карту — что предоставляет «Инфотех», как обновить безопасно'}, {'slug': 'settings', 'title': 'Раздел «Настройки» в Личном кабинете', 'desc': 'Язык, единицы измерения, PIN, опции сканера/камеры/типов, режим начала измерения'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Настройка</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Калибровка датчиков, Личный кабинет, обновление прошивки</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/05-configuration/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
