/**
 * Layout админ-панели.
 * Загружает session и передаёт user в AdminShell.
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
  if (!session?.user) {
    return <main className="flex-1">{children}</main>
  }
  return <AdminShell user={session.user}>{children}</AdminShell>
}
