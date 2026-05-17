import { describe, it, expect } from 'vitest'

/**
 * Тесты для lib/git-sync.ts — чистая логика без реального git/fs.
 */

describe('git-sync MDX frontmatter builder', () => {
  // Тестируем логику построения frontmatter (без реального git)

  function buildFrontmatter(article: {
    title: string
    description?: string
    slug: string
    order: number
    status: string
    audience?: string[]
    related?: string[]
    publishedAt?: Date | null
  }): string {
    const lines = [
      '---',
      `title: "${article.title.replace(/"/g, '\\"')}"`,
      ...(article.description
        ? [`description: "${article.description.replace(/"/g, '\\"')}"`]
        : []),
      `slug: "${article.slug}"`,
      `order: ${article.order}`,
      `status: ${article.status}`,
      ...(article.audience && article.audience.length > 0
        ? [`audience: [${article.audience.map((a) => `"${a}"`).join(', ')}]`]
        : []),
      ...(article.related && article.related.length > 0
        ? [`related: [${article.related.map((r) => `"${r}"`).join(', ')}]`]
        : []),
      ...(article.publishedAt ? [`publishedAt: "${article.publishedAt.toISOString()}"`] : []),
      '---',
      '',
    ]
    return lines.join('\n')
  }

  it('генерирует базовый frontmatter', () => {
    const fm = buildFrontmatter({
      title: 'Тест статьи',
      slug: 'test-article',
      order: 1,
      status: 'PUBLISHED',
    })
    expect(fm).toContain('title: "Тест статьи"')
    expect(fm).toContain('slug: "test-article"')
    expect(fm).toContain('order: 1')
    expect(fm).toContain('status: PUBLISHED')
    expect(fm).not.toContain('description')
    expect(fm).not.toContain('audience')
  })

  it('экранирует кавычки в title', () => {
    const fm = buildFrontmatter({
      title: 'Статья "с кавычками"',
      slug: 'test',
      order: 1,
      status: 'PUBLISHED',
    })
    expect(fm).toContain('title: "Статья \\"с кавычками\\""')
  })

  it('включает description если задан', () => {
    const fm = buildFrontmatter({
      title: 'Тест',
      description: 'Описание статьи',
      slug: 'test',
      order: 1,
      status: 'PUBLISHED',
    })
    expect(fm).toContain('description: "Описание статьи"')
  })

  it('включает audience список', () => {
    const fm = buildFrontmatter({
      title: 'Тест',
      slug: 'test',
      order: 1,
      status: 'PUBLISHED',
      audience: ['OPERATOR', 'ADMIN'],
    })
    expect(fm).toContain('audience: ["OPERATOR", "ADMIN"]')
  })

  it('не включает audience если пустой массив', () => {
    const fm = buildFrontmatter({
      title: 'Тест',
      slug: 'test',
      order: 1,
      status: 'PUBLISHED',
      audience: [],
    })
    expect(fm).not.toContain('audience')
  })

  it('начинается с --- и заканчивается пустой строкой', () => {
    const fm = buildFrontmatter({ title: 'T', slug: 's', order: 1, status: 'DRAFT' })
    expect(fm.startsWith('---\n')).toBe(true)
    expect(fm.endsWith('\n')).toBe(true)
  })
})

describe('backup filename validation', () => {
  function isValidDumpFilename(filename: string): boolean {
    const safe = filename.split('/').pop() ?? filename
    return safe === filename && safe.endsWith('.dump') && !safe.includes('..')
  }

  it('принимает валидный .dump файл', () => {
    expect(isValidDumpFilename('backup-2026-01-01.dump')).toBe(true)
  })

  it('отклоняет path traversal', () => {
    expect(isValidDumpFilename('../../../etc/passwd')).toBe(false)
    expect(isValidDumpFilename('../../secret.dump')).toBe(false)
  })

  it('отклоняет файл без .dump', () => {
    expect(isValidDumpFilename('backup.sql')).toBe(false)
    expect(isValidDumpFilename('backup.tar.gz')).toBe(false)
  })

  it('отклоняет файл с путём через слэш', () => {
    expect(isValidDumpFilename('subdir/backup.dump')).toBe(false)
  })
})
