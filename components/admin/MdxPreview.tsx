'use client'

/**
 * Preview-панель: рендерит MDX через /api/admin/preview и показывает HTML.
 * Обновляется по кнопке (не в реальном времени — рендер тяжёлый).
 */
import * as React from 'react'
import { RefreshCw } from 'lucide-react'

interface MdxPreviewProps {
  body: string
}

export function MdxPreview({ body }: MdxPreviewProps) {
  const [html, setHtml] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const bodyRef = React.useRef(body)
  bodyRef.current = body

  async function render() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: bodyRef.current }),
      })
      const json = (await res.json()) as { html?: string; error?: string }
      if (!res.ok || json.error) {
        setError(json.error ?? 'Ошибка рендера')
        return
      }
      setHtml(json.html ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Сетевая ошибка')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void render()
  }, []) // render создаётся внутри компонента, но не меняется — intentional

  const srcdoc = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.7; padding: 20px 24px; max-width: 720px; margin: 0 auto; color: #1a1a1a; }
  h1,h2,h3,h4 { line-height: 1.3; margin-top: 1.8em; margin-bottom: .5em; }
  h2 { font-size: 1.4em; border-bottom: 1px solid #e5e5e5; padding-bottom: .3em; }
  h3 { font-size: 1.15em; }
  p { margin: .8em 0; }
  code { font-family: 'JetBrains Mono', monospace; font-size: .85em; background: #f0f0f0; padding: .15em .35em; border-radius: 3px; }
  pre { background: #f6f8fa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 14px 16px; overflow-x: auto; }
  pre code { background: none; padding: 0; font-size: .85em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #d0d7de; padding: 6px 13px; }
  th { background: #f6f8fa; font-weight: 600; }
  blockquote { border-left: 3px solid #d0d7de; margin: 0; padding: 0 1em; color: #666; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  .callout { border-radius: 6px; padding: 12px 16px; margin: 1em 0; border: 1px solid; }
  .callout-info { background: #eff6ff; border-color: #93c5fd; }
  .callout-warning { background: #fffbeb; border-color: #fcd34d; }
  .callout-error { background: #fef2f2; border-color: #fca5a5; }
  ol.steps { counter-reset: steps; list-style: none; padding: 0; }
  ol.steps li { counter-increment: steps; display: flex; gap: 12px; margin: 12px 0; }
  ol.steps li::before { content: counter(steps); background: #f5c400; border-radius: 50%; width: 28px; height: 28px; min-width: 28px; display: flex; align-items: center; justify-content: center; font-size: .8em; font-weight: 700; }
</style>
</head>
<body>${html ?? '<p style="color:#aaa">Нажми «Обновить превью» для рендера.</p>'}</body>
</html>`

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border">
      <div className="flex items-center justify-between border-b bg-[var(--muted)] px-3 py-1.5">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Превью</span>
        <button
          type="button"
          onClick={() => void render()}
          disabled={loading}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            strokeWidth={1.5}
            aria-hidden
          />
          Обновить
        </button>
      </div>

      {error && <div className="px-4 py-2 text-xs text-[var(--color-error)]">⚠️ {error}</div>}

      <iframe
        title="Превью MDX"
        srcDoc={srcdoc}
        sandbox="allow-same-origin"
        className="min-h-[400px] w-full flex-1 border-0 bg-white"
      />
    </div>
  )
}
