/**
 * Синхронизирует пароль админа из .env.local (или .env) в базу Postgres.
 *
 * Seed при повторном запуске не обновляет пароль уже существующего пользователя,
 * из‑за этого в форме кажется что «не тот пароль». Этот скрипт перезаписывает хеш.
 *
 * Запуск из корня проекта:
 *   pnpm sync-admin-password
 */
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

function loadDotEnv(files: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  const root = process.cwd()
  for (const name of files) {
    const p = path.join(root, name)
    if (!fs.existsSync(p)) continue
    const text = fs.readFileSync(p, 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      out[key] = val
    }
  }
  return out
}

async function main() {
  const env = loadDotEnv(['.env.local', '.env'])
  const dbUrl = env['DATABASE_URL']
  const email = env['ADMIN_EMAIL'] ?? 'admin@inf-tec.ru'
  const plain = env['ADMIN_PASSWORD']

  if (!dbUrl) {
    console.error('Нет DATABASE_URL в .env.local или .env')
    process.exit(1)
  }
  if (!plain) {
    console.error('Нет ADMIN_PASSWORD в .env.local или .env')
    process.exit(1)
  }

  process.env.DATABASE_URL = dbUrl
  const prisma = new PrismaClient()

  const passwordHash = await bcrypt.hash(plain, 10)
  const r = await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: { passwordHash },
  })

  await prisma.$disconnect()

  if (r.count === 0) {
    console.error(`Пользователь ${email} не найден. Сначала выполните: pnpm prisma db seed`)
    process.exit(1)
  }

  console.log(
    `✓ Пароль обновлён для ${email}. Можете войти в /admin/login с тем паролем, что сейчас в ADMIN_PASSWORD.`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
