import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Сборка устройства',
  description: 'Распаковка, сборка стойки, подключение питания и сети',
}

const ARTICLES = [{'slug': 'power', 'title': 'Подключение питания и сети', 'desc': 'Розетка 220 В, Ethernet, USB-сканер — порядок подключения после сборки'}, {'slug': 'stand', 'title': 'Сборка стойки и платформы', 'desc': 'Установка устройства на штатную стойку или на передвижной стол с ИБП'}, {'slug': 'unpacking', 'title': 'Распаковка и проверка комплектации', 'desc': 'Что должно быть в коробке после получения устройства'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Сборка устройства</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Распаковка, сборка стойки, подключение питания и сети</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/02-assembly/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
