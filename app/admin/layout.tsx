/**
 * Layout админ-панели — обёртка для всех /admin/* маршрутов.
 *
 * Замечания:
 * - Middleware уже не пускает неавторизованных в /admin/* (кроме /admin/login).
 * - На /admin/login layout рендерит только children без AdminShell — за это
 *   отвечает sub-layout `app/admin/login/layout.tsx`, который перекрывает
 *   родительский AdminShell.
 * - В этом layout мы лишь заворачиваем всё в <main> с правильной шириной.
 */
import type { Metadata } from 'next'
import { auth } from '@/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: { default: 'Админ-панель Инфоскан', template: '%s · Админ Инфоскан' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // Не должно произойти — middleware гарантирует session.user. Но если что — обернём
  // как login (без shell), чтобы не упасть с null.
  if (!session?.user) {
    return <main className="flex-1">{children}</main>
  }

  return <AdminShell user={session.user}>{children}</AdminShell>
}
