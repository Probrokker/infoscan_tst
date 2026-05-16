/**
 * Футер с контактами и юридической информацией.
 */
import Link from 'next/link'
import { Mail, Phone, Send } from 'lucide-react'
import { COMPANY, SITE } from '@/lib/constants'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t bg-[var(--muted)]/30">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold">{SITE.name}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Документация и интерактивные инструменты для устройств Инфоскан.
            </p>
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Метрологический сертификат {COMPANY.metrologicalCertificate}.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Контакты</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
                <Link href={`mailto:${COMPANY.email}`} className="hover:underline">
                  {COMPANY.email}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
                <Link href={`tel:${COMPANY.phone.replace(/\s|\(|\)/g, '')}`} className="hover:underline">
                  {COMPANY.phone}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Send className="h-4 w-4 text-[var(--muted-foreground)]" strokeWidth={1.5} aria-hidden />
                <Link
                  href={COMPANY.telegramUrl}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram {COMPANY.telegram}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Компания</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {COMPANY.legalName}. На рынке с {COMPANY.sinceYear} года.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-xs text-[var(--muted-foreground)]">
          © {year} {COMPANY.legalName}. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
