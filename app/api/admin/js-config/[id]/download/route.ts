import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const config = await prisma.jsConfig.findUnique({ where: { id } })
  if (!config) return new NextResponse('Not found', { status: 404 })

  const filename = `${config.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')}.js`

  return new NextResponse(config.generatedCode, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
