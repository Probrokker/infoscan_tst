/**
 * Layout публичного сайта: шапка, футер, skip-link, main-обёртка.
 * Все публичные маршруты (/, /<section>, /<section>/<slug>, /learning-paths/...,
 * /emulator, /integration/...) живут в этой route group.
 */
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        К основному содержимому
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
