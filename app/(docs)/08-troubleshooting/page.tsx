import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Диагностика и FAQ',
  description: 'Частые вопросы, диагностика по симптомам, коды ошибок',
}

const ARTICLES = [{'slug': 'diagnostics', 'title': 'Диагностика по симптомам', 'desc': 'Что проверять, если устройство ведёт себя нестандартно'}, {'slug': 'error-codes', 'title': 'Коды ошибок', 'desc': 'Расшифровка кодов ошибок, которые могут появиться на экране устройства'}, {'slug': 'faq', 'title': 'Часто задаваемые вопросы', 'desc': 'Ответы на типовые вопросы по эксплуатации Инфоскана'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Диагностика и FAQ</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Частые вопросы, диагностика по симптомам, коды ошибок</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/08-troubleshooting/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
