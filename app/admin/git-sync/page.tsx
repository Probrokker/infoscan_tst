import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getGitSyncRunsAction } from './actions'
import { GitSyncClient } from './GitSyncClient'

export const metadata = { title: 'Sync to Git — Инфоскан Admin' }

export default async function GitSyncPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/admin/login')

  const runs = await getGitSyncRunsAction()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sync to Git</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Экспортирует контент из базы данных в Git-репозиторий как резервную копию и для CI/CD.
        </p>
      </div>
      <GitSyncClient
        initialRuns={runs}
        repoUrl={process.env.GIT_REPO_URL ?? ''}
        branch={process.env.GIT_BRANCH ?? 'main'}
      />
    </div>
  )
}
