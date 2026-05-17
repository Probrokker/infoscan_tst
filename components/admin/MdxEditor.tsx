'use client'

/**
 * MDX-редактор на основе CodeMirror 6.
 *
 * Возможности:
 *   - Подсветка Markdown (lang-markdown).
 *   - Slash-команды: набери / в начале строки → появляется меню вставки.
 *   - Image paste/drop: вставь или перетащи картинку → загружается на сервер,
 *     MDX-тег ![alt](url) вставляется в позицию курсора.
 *   - Автосохранение через debounce 2s → вызывает onSave(body).
 *   - Toolbar: Bold, Italic, Code, Link, Heading, Quote.
 */
import * as React from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { EditorView, type KeyBinding, keymap } from '@codemirror/view'
import { type EditorState, type Transaction } from '@codemirror/state'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'
import { Bold, Italic, Code, Link, Heading2, Quote, Image, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface MdxEditorProps {
  initialValue: string
  articleId: string
  onSave: (body: string) => Promise<void>
  saving?: boolean
}

// ---- Slash-команды ----

interface SlashCommand {
  label: string
  description: string
  snippet: string
  icon: string
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    label: '/callout-info',
    description: 'Информационный блок',
    icon: 'ℹ️',
    snippet: '<Callout type="info">\nТекст подсказки.\n</Callout>',
  },
  {
    label: '/callout-warning',
    description: 'Предупреждение',
    icon: '⚠️',
    snippet: '<Callout type="warning">\nТекст предупреждения.\n</Callout>',
  },
  {
    label: '/callout-error',
    description: 'Ошибка / опасность',
    icon: '🚨',
    snippet: '<Callout type="error">\nТекст ошибки.\n</Callout>',
  },
  {
    label: '/steps',
    description: 'Пошаговая инструкция',
    icon: '🔢',
    snippet:
      '<Steps>\n  <Step>\n    ### Шаг 1\n\n    Описание.\n  </Step>\n  <Step>\n    ### Шаг 2\n\n    Описание.\n  </Step>\n</Steps>',
  },
  {
    label: '/code',
    description: 'Блок кода',
    icon: '💻',
    snippet: '```javascript\n// Ваш код здесь\n```',
  },
  {
    label: '/table',
    description: 'Таблица (3×3)',
    icon: '📊',
    snippet:
      '| Колонка 1 | Колонка 2 | Колонка 3 |\n|---|---|---|\n| Ячейка | Ячейка | Ячейка |\n| Ячейка | Ячейка | Ячейка |',
  },
  {
    label: '/image',
    description: 'Изображение',
    icon: '🖼️',
    snippet: '![Описание изображения](/uploads/image.webp)',
  },
  {
    label: '/h2',
    description: 'Заголовок 2 уровня',
    icon: 'H2',
    snippet: '## Заголовок',
  },
  {
    label: '/h3',
    description: 'Заголовок 3 уровня',
    icon: 'H3',
    snippet: '### Заголовок',
  },
]

// ---- Загрузка изображений ----

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Ошибка загрузки: ${res.status}`)
  }
  const json = (await res.json()) as { url: string }
  return json.url
}

// ---- Toolbar action ----

function wrapSelection(view: EditorView, before: string, after: string, placeholder = 'текст') {
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.sliceDoc(from, to)
  const replacement =
    selected.length > 0 ? `${before}${selected}${after}` : `${before}${placeholder}${after}`
  view.dispatch({
    changes: { from, to, insert: replacement },
    selection: {
      anchor: selected.length > 0 ? from + before.length : from + before.length,
      head: selected.length > 0 ? to + before.length : from + before.length + placeholder.length,
    },
  })
  view.focus()
}

// ---- Компонент ----

export function MdxEditor({ initialValue, articleId, onSave, saving }: MdxEditorProps) {
  const [value, setValue] = React.useState(initialValue)
  const [slashMenu, setSlashMenu] = React.useState<{
    open: boolean
    filter: string
    cursorPos: { top: number; left: number }
    lineStart: number
  }>({ open: false, filter: '', cursorPos: { top: 0, left: 0 }, lineStart: 0 })
  const [uploading, setUploading] = React.useState(false)
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  // Автосохранение с debounce 2s
  function handleChange(val: string) {
    setValue(val)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      onSave(val).catch((e: unknown) => {
        console.error('[editor] autosave failed', e)
      })
    }, 2000)
  }

  // Ручное сохранение Cmd+S
  const saveKeymap: KeyBinding = {
    key: 'Mod-s',
    run: () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      onSave(value).catch((e: unknown) => console.error('[editor] save failed', e))
      return true
    },
  }

  // Слэш-меню: обновляем при каждом изменении если начинается с /
  function handleUpdate(state: EditorState, _: Transaction | null) {
    const pos = state.selection.main.head
    const line = state.doc.lineAt(pos)
    const lineText = state.sliceDoc(line.from, pos)
    if (lineText.startsWith('/')) {
      const coords = editorRef.current?.view?.coordsAtPos(pos)
      setSlashMenu({
        open: true,
        filter: lineText.slice(1).toLowerCase(),
        cursorPos: { top: (coords?.bottom ?? 0) + 4, left: coords?.left ?? 0 },
        lineStart: line.from,
      })
    } else {
      setSlashMenu((p) => ({ ...p, open: false }))
    }
  }

  function insertSlashSnippet(cmd: SlashCommand) {
    const view = editorRef.current?.view
    if (!view) return
    const { lineStart } = slashMenu
    const pos = view.state.selection.main.head
    view.dispatch({
      changes: { from: lineStart, to: pos, insert: cmd.snippet },
    })
    setSlashMenu((p) => ({ ...p, open: false }))
    view.focus()
  }

  // Paste/Drop изображений
  async function handleImageFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) return
    setUploading(true)
    for (const file of arr) {
      try {
        const url = await uploadImage(file)
        const view = editorRef.current?.view
        if (view) {
          const pos = view.state.selection.main.head
          const insert = `![${file.name.replace(/\.[^.]+$/, '')}](${url})\n`
          view.dispatch({ changes: { from: pos, to: pos, insert } })
          setValue((v) => {
            const lines = v.split('\n')
            return lines.join('\n') // triggers re-render + autosave
          })
        }
        toast.success(`Изображение загружено: ${url}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Ошибка загрузки')
      }
    }
    setUploading(false)
  }

  // Drop handler
  function handleDrop(e: React.DragEvent) {
    if (!e.dataTransfer.files.length) return
    e.preventDefault()
    void handleImageFiles(e.dataTransfer.files)
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    const imageItems = Array.from(items)
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageItems.length === 0) return
    e.preventDefault()
    void handleImageFiles(imageItems)
  }

  const filteredCommands = SLASH_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(slashMenu.filter) ||
      c.description.toLowerCase().includes(slashMenu.filter),
  )

  const view = editorRef.current?.view

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-[var(--muted)] px-2 py-1">
        {[
          {
            icon: Bold,
            label: 'Жирный (⌘B)',
            action: () => view && wrapSelection(view, '**', '**'),
          },
          {
            icon: Italic,
            label: 'Курсив (⌘I)',
            action: () => view && wrapSelection(view, '_', '_'),
          },
          { icon: Code, label: 'Код', action: () => view && wrapSelection(view, '`', '`', 'code') },
          {
            icon: Link,
            label: 'Ссылка',
            action: () => view && wrapSelection(view, '[', '](url)', 'текст ссылки'),
          },
          {
            icon: Heading2,
            label: 'H2',
            action: () => view && wrapSelection(view, '## ', '', 'Заголовок'),
          },
          {
            icon: Quote,
            label: 'Цитата',
            action: () => view && wrapSelection(view, '> ', '', 'Цитата'),
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={action}
            className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        ))}

        <div className="mx-1 h-4 w-px bg-[var(--border)]" />

        {/* Upload button */}
        <label
          htmlFor={`img-upload-${articleId}`}
          className="cursor-pointer rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          title="Загрузить изображение"
        >
          <Image className="h-4 w-4" strokeWidth={1.5} aria-label="Загрузить изображение" />
          <input
            id={`img-upload-${articleId}`}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => e.target.files && void handleImageFiles(e.target.files)}
          />
        </label>

        {/* Status indicators */}
        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {uploading && (
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3 animate-pulse" strokeWidth={1.5} />
              Загружаю...
            </span>
          )}
          {saving && <span className="animate-pulse">Сохраняю…</span>}
          <span className="hidden sm:block">/ для команд</span>
        </div>
      </div>

      {/* CodeMirror */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
        className="relative"
      >
        <CodeMirror
          ref={editorRef}
          value={value}
          onChange={handleChange}
          theme={isDark ? githubDark : githubLight}
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            EditorView.lineWrapping,
            keymap.of([saveKeymap]),
            EditorView.updateListener.of((update) => {
              if (update.selectionSet || update.docChanged) {
                handleUpdate(update.state, update.transactions[0] ?? null)
              }
            }),
          ]}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            history: true,
            foldGutter: false,
            bracketMatching: true,
          }}
          className="min-h-[400px] text-sm"
          style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)' }}
        />

        {/* Slash-command menu */}
        {slashMenu.open && filteredCommands.length > 0 && (
          <div
            className="fixed z-50 max-h-64 w-64 overflow-y-auto rounded-[var(--radius-card)] border bg-[var(--background)] shadow-lg"
            style={{ top: slashMenu.cursorPos.top, left: slashMenu.cursorPos.left }}
          >
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--accent)]"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertSlashSnippet(cmd)
                }}
              >
                <span className="w-5 text-center text-base">{cmd.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium">{cmd.label.slice(1)}</div>
                  <div className="truncate text-xs text-[var(--muted-foreground)]">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
