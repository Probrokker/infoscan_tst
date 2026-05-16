/**
 * Хлебные крошки. Получает массив { label, href }.
 */
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({ items }: { items: Array<{ label: string; href: string }> }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-[var(--muted-foreground)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={item.href} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight className="h-3 w-3" strokeWidth={1.5} aria-hidden />}
              {isLast ? (
                <span className="text-[var(--foreground)]">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
