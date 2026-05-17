/**
 * POST /api/admin/upload — загрузка изображений для MDX-редактора.
 *
 * Принимает multipart/form-data с полем file (image/*).
 * Конвертирует в WebP через sharp, сохраняет в public/uploads/<date>/<hash>.webp.
 * Возвращает { url: '/uploads/...' }.
 *
 * Безопасность:
 * - Проверяем сессию через auth().
 * - Лимит 5 МБ на файл.
 * - Разрешены только image/*.
 * - Имя файла — crypto hash, не user-input.
 */
import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { auth } from '@/auth'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Ожидается multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Не удалось разобрать форму' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Поле file обязательно' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Разрешены только изображения' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Файл больше 5 МБ' }, { status: 413 })
  }

  // Конвертируем в WebP 85%
  let webpBuffer: Buffer
  try {
    webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer()
  } catch {
    return NextResponse.json({ error: 'Не удалось обработать изображение' }, { status: 422 })
  }

  // Директория по дате
  const dateDir = new Date().toISOString().slice(0, 7) // YYYY-MM
  const dir = path.join(UPLOADS_ROOT, dateDir)
  await fs.mkdir(dir, { recursive: true })

  // Имя файла — sha256 содержимого
  const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex').slice(0, 16)
  const filename = `${hash}.webp`
  const filePath = path.join(dir, filename)

  await fs.writeFile(filePath, webpBuffer)

  const url = `/uploads/${dateDir}/${filename}`
  return NextResponse.json({ url })
}
