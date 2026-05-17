/**
 * lib/backup.ts — pg_dump / pg_restore через child_process.
 *
 * Создаёт файлы в ./backups/<timestamp>.dump (custom format, максимальное сжатие).
 * Восстановление — pg_restore с --clean --if-exists, только от ADMIN.
 *
 * В Docker-контейнере pg_dump/pg_restore доступны т.к. мы ставим postgresql-client
 * в Dockerfile. Локально нужен postgresql-client (brew install libpq).
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'

const BACKUPS_DIR = path.join(process.cwd(), 'backups')

export interface BackupFile {
  filename: string
  sizeBytes: number
  createdAt: string // ISO string
}

/** Возвращает список бэкапов, новые первые */
export async function listBackups(): Promise<BackupFile[]> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true })
  const files = await fs.readdir(BACKUPS_DIR)
  const dumps = files.filter((f) => f.endsWith('.dump'))

  const entries = await Promise.all(
    dumps.map(async (f) => {
      const stat = await fs.stat(path.join(BACKUPS_DIR, f))
      return {
        filename: f,
        sizeBytes: stat.size,
        createdAt: stat.birthtime.toISOString(),
      }
    }),
  )

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Запускает pg_dump, возвращает имя файла или бросает ошибку */
export async function createBackup(databaseUrl: string): Promise<string> {
  await fs.mkdir(BACKUPS_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup-${timestamp}.dump`
  const filePath = path.join(BACKUPS_DIR, filename)

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'pg_dump',
      ['--format=custom', '--compress=9', `--file=${filePath}`, databaseUrl],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`pg_dump завершился с кодом ${code}: ${stderr.slice(0, 500)}`))
      }
    })

    proc.on('error', (err) => {
      reject(
        new Error(
          `Не удалось запустить pg_dump: ${err.message}. Убедись что postgresql-client установлен.`,
        ),
      )
    })
  })

  return filename
}

/** Восстанавливает БД из файла. НЕОБРАТИМО! */
export async function restoreBackup(filename: string, databaseUrl: string): Promise<void> {
  // Защита от path traversal
  const safe = path.basename(filename)
  if (!safe.endsWith('.dump')) throw new Error('Недопустимое имя файла')

  const filePath = path.join(BACKUPS_DIR, safe)
  if (!existsSync(filePath)) throw new Error('Файл бэкапа не найден')

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'pg_restore',
      ['--clean', '--if-exists', '--no-acl', '--no-owner', `--dbname=${databaseUrl}`, filePath],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )

    let stderr = ''
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      // pg_restore возвращает 1 при незначительных предупреждениях — считаем OK
      if (code === 0 || code === 1) {
        resolve()
      } else {
        reject(new Error(`pg_restore завершился с кодом ${code}: ${stderr.slice(0, 500)}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Не удалось запустить pg_restore: ${err.message}`))
    })
  })
}

/** Удаляет файл бэкапа */
export async function deleteBackupFile(filename: string): Promise<void> {
  const safe = path.basename(filename)
  if (!safe.endsWith('.dump')) throw new Error('Недопустимое имя файла')
  await fs.rm(path.join(BACKUPS_DIR, safe), { force: true })
}
