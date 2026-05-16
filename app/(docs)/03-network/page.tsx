import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Подключение и сеть',
  description: 'Проводное и беспроводное подключение, доступ к Личному кабинету устройства',
}

const ARTICLES = [{'slug': 'firewall', 'title': 'VLAN, firewall, порты', 'desc': 'Какие правила нужны в файрволе и в коммутаторе для работы Инфоскана'}, {'slug': 'personal-cabinet', 'title': 'Доступ к Личному кабинету устройства', 'desc': 'Как открыть веб-интерфейс Инфоскана по IP, сменить пароль admin и PIN'}, {'slug': 'wired', 'title': 'Проводное подключение', 'desc': 'Настройка Ethernet — DHCP или статический IP, какие порты должны быть открыты для интеграции с WMS'}, {'slug': 'wireless', 'title': 'Беспроводное подключение (Wi-Fi)', 'desc': 'Настройка Wi-Fi на версии PRO — SSID, пароль, 5 GHz, IPv6'}]

export default function SectionIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          <BookOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Раздел
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Подключение и сеть</h1>
        <p className="mt-3 text-lg text-[var(--muted-foreground)]">Проводное и беспроводное подключение, доступ к Личному кабинету устройства</p>
      </header>
      <ol className="space-y-3">
        {ARTICLES.map((a) => (
          <li key={a.slug} className="rounded-[var(--radius-card)] border transition-colors hover:bg-[var(--accent)]">
            <Link href={`/03-network/${a.slug}`} className="flex items-start justify-between gap-4 p-4">
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
