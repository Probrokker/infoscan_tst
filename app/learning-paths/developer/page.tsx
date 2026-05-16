import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Маршрут «Разработчик» — 1 день',
  description: 'Учебная дорожка для интегратора WMS',
}

const STEPS = [
  { slug: '06-integration/architecture', title: 'Архитектура шаблонов', desc: 'Как устроена интеграция' },
  { slug: '06-integration/runtime', title: 'Среда выполнения JS', desc: 'SENSOR, BARCODE, HELPER_JS' },
  { slug: '06-integration/transports', title: 'Транспорты', desc: 'http, tcp, ftp, file, qr' },
  { slug: '06-integration/auth', title: 'Аутентификация', desc: 'Basic, Bearer, OAuth 2.0' },
  { slug: '06-integration/finish-send', title: 'Finish Send', desc: 'Главный шаблон отправки' },
  { slug: '06-integration/item-type', title: 'Item Type', desc: 'Доп. экраны до измерения' },
  { slug: 'integration/builder', title: '🛠 Конструктор', desc: 'Собрать шаблон за 6 шагов' },
  { slug: 'emulator', title: '🛠 Эмулятор', desc: 'Проверить в песочнице' },
  { slug: '06-integration/error-handling', title: 'Обработка ошибок', desc: 'resp, throw Error, баннеры' },
  { slug: '06-integration/example-1c', title: 'Пример: 1С', desc: 'Готовый шаблон отправки' },
]

export default function DeveloperPath() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Учебная дорожка</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Маршрут разработчика</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">За день соберёте полный шаблон интеграции с WMS и проверите на эмуляторе.</p>
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
