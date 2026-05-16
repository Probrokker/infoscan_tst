'use client'

/**
 * Финальная вкладка конструктора: три таба — JS-код / cURL / Документация.
 * Кнопки «Копировать» и «Скачать» — без зависимостей, через Clipboard API + Blob.
 */
import * as React from 'react'
import { Copy, Check, Download } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import { useBuilderStore } from '../model/store'
import { generateScript, generateCurl, generateDocumentation } from '../lib/generator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)
  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }, [text])
  return (
    <Button size="sm" variant="outline" onClick={onCopy} aria-label="Скопировать в буфер обмена">
      {copied ? (
        <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      )}
      {copied ? 'Скопировано' : 'Копировать'}
    </Button>
  )
}

function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const onDownload = React.useCallback(() => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [text, filename])
  return (
    <Button size="sm" variant="outline" onClick={onDownload}>
      <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Скачать
    </Button>
  )
}

export function Result() {
  const state = useBuilderStore()
  const script = React.useMemo(() => generateScript(state), [state])
  const curl = React.useMemo(() => generateCurl(state), [state])
  const docs = React.useMemo(() => generateDocumentation(state), [state])

  return (
    <Tabs.Root defaultValue="script" className="mt-8">
      <Tabs.List
        className="flex flex-wrap items-center gap-1 border-b border-[var(--border)]"
        aria-label="Результат конструктора"
      >
        {[
          { v: 'script', label: 'JS-код шаблона' },
          { v: 'curl', label: 'Тестовый запрос' },
          { v: 'docs', label: 'Документация' },
        ].map((t) => (
          <Tabs.Trigger
            key={t.v}
            value={t.v}
            className={cn(
              'rounded-t-[var(--radius-btn)] px-3 py-2 text-sm font-medium transition-colors',
              'data-[state=inactive]:text-[var(--muted-foreground)]',
              'data-[state=active]:bg-[var(--muted)] data-[state=active]:text-[var(--foreground)]',
              'hover:text-[var(--foreground)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="script" className="rounded-b-[var(--radius-card)] bg-[var(--muted)] p-4">
        <div className="mb-3 flex justify-end gap-2">
          <CopyButton text={script} />
          <DownloadButton text={script} filename={`${state.scriptKind}.js`} />
        </div>
        <pre className="overflow-x-auto rounded-[var(--radius-btn)] bg-[var(--background)] p-4 text-xs">
          <code className="font-mono">{script}</code>
        </pre>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Скопируйте код и вставьте в раздел «Алгоритмы» Личного кабинета устройства
          (вкладка <span className="font-mono">{state.scriptKind}</span>).
        </p>
      </Tabs.Content>

      <Tabs.Content value="curl" className="rounded-b-[var(--radius-card)] bg-[var(--muted)] p-4">
        <div className="mb-3 flex justify-end">
          <CopyButton text={curl} />
        </div>
        <pre className="overflow-x-auto rounded-[var(--radius-btn)] bg-[var(--background)] p-4 text-xs">
          <code className="font-mono">{curl}</code>
        </pre>
      </Tabs.Content>

      <Tabs.Content value="docs" className="rounded-b-[var(--radius-card)] bg-[var(--muted)] p-4">
        <div className="mb-3 flex justify-end gap-2">
          <CopyButton text={docs} />
          <DownloadButton text={docs} filename="integration-docs.md" />
        </div>
        <pre className="overflow-x-auto rounded-[var(--radius-btn)] bg-[var(--background)] p-4 text-xs">
          <code className="font-mono">{docs}</code>
        </pre>
      </Tabs.Content>
    </Tabs.Root>
  )
}
