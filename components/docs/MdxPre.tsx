'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Блок кода из MDX (rehype-pretty-code / Shiki): рамка, фон, горизонтальная прокрутка,
 * кнопка «Копировать» (текст целиком, включая подсветку).
 */
export function MdxPre({ children, className, ...props }: React.ComponentPropsWithoutRef<'pre'>) {
  const ref = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    const el = ref.current
    if (!el) return
    const text = el.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="not-prose group relative my-6">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 z-10 h-8 gap-1 border border-[var(--border)] bg-[var(--card)] px-2.5 text-xs shadow-sm hover:bg-[var(--accent)]"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Скопировано
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Копировать
          </>
        )}
      </Button>
      <pre
        ref={ref}
        className={cn(
          'mb-0 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]',
          'bg-[var(--muted)] p-4 pt-12 text-[0.8125rem] leading-relaxed',
          '[&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-mono [&_code]:text-[inherit]',
          className,
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}
