import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Маршрут «Админ» — 2 часа',
  description: 'Учебная дорожка для ИТ-администратора склада',
}

const STEPS = [
  { slug: '02-assembly/unpacking', title: 'Распаковка и проверка', desc: 'Что внутри коробки' },
  { slug: '02-assembly/stand', title: 'Сборка стойки и платформы', desc: 'Пошаговая сборка' },
  { slug: '02-assembly/power', title: 'Подключение питания', desc: '220В, кабели, ИБП' },
  { slug: '03-network/wired', title: 'Проводное подключение', desc: 'DHCP или статический IP' },
  { slug: '03-network/personal-cabinet', title: 'Доступ к Личному кабинету', desc: 'http://[IP]/, admin/admin' },
  { slug: '05-configuration/settings', title: 'Раздел «Настройки»', desc: 'Язык, единицы, опции' },
  { slug: '05-configuration/calibration-laser', title: 'Калибровка ЛД', desc: 'Кубик 20×20×20' },
  { slug: '05-configuration/calibration-weight', title: 'Калибровка ВД', desc: 'Гиря 20–40 кг' },
  { slug: '07-service/maintenance', title: 'Плановое обслуживание', desc: 'Что и когда делать' },
]

export default function AdminPath() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Учебная дорожка</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Маршрут админа</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">За 2 часа соберёте, подключите, откалибруете устройство и настроите Личный кабинет.</p>
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
