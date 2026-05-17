/**
 * Сборка поискового индекса. Запускается после `next build` через постхук.
 * Складывает индекс в public/search-index.json — это статический JSON,
 * который читается клиентом при открытии Cmd+K (lazy fetch).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { getSearchIndex } from '../features/search/lib/index-data'

async function main() {
  const outPath = path.join(process.cwd(), 'public', 'search-index.json')
  await fs.mkdir(path.dirname(outPath), { recursive: true })

  let index: Awaited<ReturnType<typeof getSearchIndex>>
  try {
    index = await getSearchIndex()
  } catch (err) {
    // В Docker-сборке БД недоступна — сохраняем существующий индекс или пустой.
    // Реальный индекс будет пересобран при следующем пуске сервера.
    const existing = await fs.readFile(outPath, 'utf8').catch(() => '[]')
    console.warn(
      'WARN: БД недоступна при сборке поискового индекса, оставляем существующий:',
      (err as Error).message,
    )
    await fs.writeFile(outPath, existing, 'utf8')
    return
  }

  await fs.writeFile(outPath, JSON.stringify(index), 'utf8')
  console.log(
    `✓ search-index.json собран: ${index.length} записей, ${(JSON.stringify(index).length / 1024).toFixed(1)} KB`,
  )
}

main().catch((err) => {
  console.error('Ошибка сборки поискового индекса:', err)
  process.exit(1)
})
