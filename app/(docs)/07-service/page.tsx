import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Регламенты и сервис',
  description: 'Регламент эксплуатации, обслуживание, гарантия',
}

const ARTICLES = [{'slug': 'maintenance', 'title': 'Плановое обслуживание', 'desc': 'Регулярные процедуры для поддержания точности и работоспособности устройства'}, {'slug': 'regulation', 'title': 'Регламент эксплуатации', 'desc': 'Правила работы с устройством — что обязательно, что запрещено'}, {'slug': 'warranty', 'title': 'Гарантия и SLA', 'desc': 'Гарантийные обязательства, SLA сервисной поддержки, что покрыто и что нет'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Регламенты и сервис</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Регламент эксплуатации, обслуживание, гарантия</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/07-service/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
