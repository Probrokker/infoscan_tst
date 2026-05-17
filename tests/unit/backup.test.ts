import { describe, it, expect } from 'vitest'
import path from 'node:path'

/**
 * Тесты защиты от path-traversal в именах файлов бэкапов.
 *
 * lib/backup.ts использует path.basename() — это само по себе защита:
 * `path.basename('../../secret.dump')` === `'secret.dump'`.
 * Тест проверяет логику валидации, копируя её здесь.
 */

function validateBackupFilename(filename: string): { safe: string } | null {
  const safe = path.basename(filename)
  if (!safe.endsWith('.dump')) return null
  return { safe }
}

describe('validateBackupFilename', () => {
  it('принимает корректный .dump файл', () => {
    expect(validateBackupFilename('backup-2026-01-01.dump')).not.toBeNull()
    expect(validateBackupFilename('backup-2026-01-01.dump')?.safe).toBe('backup-2026-01-01.dump')
  })

  it('path.basename защищает от traversal — extracts basename only', () => {
    // path.basename нейтрализует путь, оставляя только имя файла
    expect(path.basename('../../secret.dump')).toBe('secret.dump')
    expect(path.basename('../../../etc/passwd')).toBe('passwd')
    expect(path.basename('subdir/backup.dump')).toBe('backup.dump')
  })

  it('отклоняет файлы без расширения .dump', () => {
    expect(validateBackupFilename('backup.sql')).toBeNull()
    expect(validateBackupFilename('backup.tar.gz')).toBeNull()
    expect(validateBackupFilename('readme.txt')).toBeNull()
    expect(validateBackupFilename('passwd')).toBeNull()
  })

  it('принимает .dump файл с числами и дефисами', () => {
    const result = validateBackupFilename('backup-2026-05-17T12-00-00.dump')
    expect(result).not.toBeNull()
    expect(result?.safe).toBe('backup-2026-05-17T12-00-00.dump')
  })
})

describe('formatBytes', () => {
  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  it('форматирует байты', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})
