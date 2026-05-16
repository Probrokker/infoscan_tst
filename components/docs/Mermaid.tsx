/**
 * Mermaid-обёртка. Сами диаграммы рендерятся в SVG на этапе MDX-компиляции
 * через @theguild/remark-mermaid — здесь только финальная подача SVG-блока.
 * Это позволяет не тянуть mermaid.js в браузер и держать CSP жёстким (без runtime-eval).
 */
import { cn } from '@/lib/utils'

export function Mermaid({
  children,
  className,
  caption,
}: {
  children: React.ReactNode
  className?: string
  caption?: string
}) {
  return (
    <figure className={cn('my-6', className)}>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border bg-[var(--card)] p-4">
        {children}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
