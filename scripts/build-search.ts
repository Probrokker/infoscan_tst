/**
 * Сборка поискового индекса. Запускается после `next build` через постхук.
 * Складывает индекс в public/search-index.json — это статический JSON,
 * который читается клиентом при открытии Cmd+K (lazy fetch).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { getSearchIndex } from '../features/search/lib/index-data'

async function main() {
  const index = getSearchIndex()
  const outPath = path.join(process.cwd(), 'public', 'search-index.json')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(index), 'utf8')
  console.log(`✓ search-index.json собран: ${index.length} записей, ${(JSON.stringify(index).length / 1024).toFixed(1)} KB`)
}

main().catch((err) => {
  console.error('Ошибка сборки поискового индекса:', err)
  process.exit(1)
})
