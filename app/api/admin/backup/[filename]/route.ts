/**
 * GET /api/admin/backup/[filename] — скачать файл бэкапа.
 * Защищён сессией + только ADMIN.
 */
import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { auth } from '@/auth'

const BACKUPS_DIR = path.join(process.cwd(), 'backups')

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
  }

  const { filename } = await params
  const safe = path.basename(filename)
  if (!safe.endsWith('.dump')) {
    return NextResponse.json({ error: 'Недопустимый файл' }, { status: 400 })
  }

  const filePath = path.join(BACKUPS_DIR, safe)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 })
  }

  const buffer = await fs.readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safe}"`,
      'Content-Length': String(buffer.byteLength),
    },
  })
}
