/**
 * Health endpoint для Docker healthcheck и nginx upstream-check.
 * Проверяет коннект к БД через простой SELECT 1.
 */
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus: 'ok' | 'error' = 'ok'
  let dbError: string | undefined

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    dbStatus = 'error'
    dbError = error instanceof Error ? error.message : String(error)
  }

  const overall = dbStatus === 'ok' ? 'ok' : 'degraded'

  return Response.json(
    {
      status: overall,
      service: 'infoscan-docs',
      db: dbStatus,
      ...(dbError ? { dbError } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: dbStatus === 'ok' ? 200 : 503 },
  )
}
