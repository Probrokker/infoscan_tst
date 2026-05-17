'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { runGitSync, type GitSyncResult } from '@/lib/git-sync'

async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return session.user as { id: string; role: string }
}

export async function triggerGitSyncAction(): Promise<GitSyncResult> {
  try {
    const user = await requireSession()
    return await runGitSync(user.id)
  } catch (e) {
    return {
      ok: false,
      filesChanged: 0,
      durationMs: 0,
      errorText: e instanceof Error ? e.message : 'Ошибка',
    }
  }
}

export interface SyncRunRow {
  id: string
  status: string
  commitSha: string | null
  message: string | null
  filesChanged: number
  durationMs: number
  errorText: string | null
  createdAt: string
  triggeredBy: string | null
  triggeredByName: string | null
}

export async function getGitSyncRunsAction(): Promise<SyncRunRow[]> {
  await requireSession()
  const runs = await prisma.gitSyncRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const userIds = [...new Set(runs.map((r) => r.triggeredBy).filter(Boolean) as string[])]
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : []
  const userMap = new Map(users.map((u) => [u.id, u.name]))

  return runs.map((r) => ({
    id: r.id,
    status: r.status,
    commitSha: r.commitSha,
    message: r.message,
    filesChanged: r.filesChanged,
    durationMs: r.durationMs,
    errorText: r.errorText,
    createdAt: r.createdAt.toISOString(),
    triggeredBy: r.triggeredBy,
    triggeredByName: r.triggeredBy ? (userMap.get(r.triggeredBy) ?? null) : null,
  }))
}
