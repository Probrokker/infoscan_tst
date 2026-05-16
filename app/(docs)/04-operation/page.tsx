import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Эксплуатация',
  description: 'Включение, измерения, история, обработка ошибок',
}

const ARTICLES = [{'slug': 'errors', 'title': 'Что делать при ошибке измерения', 'desc': 'Быстрая инструкция оператору при красном баннере или «Ошибка измерений»'}, {'slug': 'history', 'title': 'История измерений', 'desc': 'Где смотреть прошлые замеры, журнал событий устройства'}, {'slug': 'item-type-operator', 'title': 'Item Type — дополнительные экраны', 'desc': 'Что делать, когда устройство задаёт «Выберите тип упаковки» или «Введите количество»'}, {'slug': 'main-screen', 'title': 'Главный экран', 'desc': 'Что за элементы на главном экране Инфоскана и для чего они нужны'}, {'slug': 'measure-irregular', 'title': 'Измерение объектов неправильной формы', 'desc': 'Мешки, конверты, мягкие упаковки — как мерить с уголками и магнитными бегунками'}, {'slug': 'measure-regular', 'title': 'Измерение за 3 шага', 'desc': 'Базовый сценарий для коробок правильной формы — отсканировать, положить, дождаться записи'}, {'slug': 'startup', 'title': 'Включение и проверка датчиков', 'desc': 'Что происходит при запуске устройства, что означает экран загрузки'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Эксплуатация</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Включение, измерения, история, обработка ошибок</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/04-operation/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
