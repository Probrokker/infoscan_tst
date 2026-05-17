import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getBackupsAction } from './actions'
import { BackupsClient } from './BackupsClient'

export const metadata = { title: 'Бэкапы — Инфоскан Admin' }

export default async function BackupsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/admin')

  const backups = await getBackupsAction()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Резервные копии</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Управление бэкапами PostgreSQL. Автоматические бэкапы выполняет контейнер{' '}
          <code className="rounded bg-[var(--muted)] px-1 font-mono text-xs">backup</code> в
          docker-compose.
        </p>
      </div>
      <BackupsClient initialBackups={backups} />
    </div>
  )
}
