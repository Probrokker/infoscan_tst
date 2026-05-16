// Этот роут оставлен пустым для совместимости. Логика страниц разделов
// перенесена в app/[...slug]/page.tsx — это убирает конфликт URL: страница
// раздела доступна напрямую по /<sectionId>/, без префикса /section/.
//
// Файл нельзя удалить из песочницы инструментов — оставляем редирект,
// который никогда не сматчится: generateStaticParams возвращает пусто,
// сам компонент рендерится только при ручном обращении к /section/<x>/.
import { notFound } from 'next/navigation'

export function generateStaticParams(): Array<{ id: string }> {
  return []
}

export default function SectionRedirectPage() {
  notFound()
}
