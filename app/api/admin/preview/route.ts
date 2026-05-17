/**
 * POST /api/admin/preview — рендер MDX → HTML через unified pipeline (без React).
 *
 * MDX custom-компоненты (Callout, Steps) обрабатываем как обычные HTML-теги
 * через rehype-raw, что даёт достаточный визуальный превью.
 * Ответ: { html: string }.
 */
import { NextResponse } from 'next/server'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import { auth } from '@/auth'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  let body: string
  try {
    const json = (await request.json()) as { body?: unknown }
    body = typeof json.body === 'string' ? json.body : ''
  } catch {
    return NextResponse.json({ error: 'Неверный JSON' }, { status: 400 })
  }

  if (body.length > 200_000) {
    return NextResponse.json({ error: 'Слишком большое тело' }, { status: 413 })
  }

  // MDX: преобразуем JSX-теги в псевдо-HTML чтобы rehype-raw их принял
  // <Callout type="warning"> → <div class="callout callout-warning">
  const preprocessed = body
    .replace(/<Callout\s+type="(\w+)">/g, '<div class="callout callout-$1">')
    .replace(/<\/Callout>/g, '</div>')
    .replace(/<Steps>/g, '<ol class="steps">')
    .replace(/<\/Steps>/g, '</ol>')
    .replace(/<Step>/g, '<li>')
    .replace(/<\/Step>/g, '</li>')
    .replace(/<CodeTabs[^>]*>/g, '<div class="code-tabs">')
    .replace(/<\/CodeTabs>/g, '</div>')
    // Убираем оставшиеся JSX-компоненты которые remark не поймёт
    .replace(/<[A-Z][A-Za-z]*[^>]*\/>/g, '')

  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .process(preprocessed)

    return NextResponse.json({ html: String(file) })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 400) : 'Ошибка рендера'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
