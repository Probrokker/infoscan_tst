'use client'

import * as React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { EditorView } from '@codemirror/view'
import { githubLight, githubDark } from '@uiw/codemirror-theme-github'

interface JsEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  minHeight?: string
  placeholder?: string
}

const baseTheme = EditorView.theme({
  '&': { fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' },
})

export function JsEditor({
  value,
  onChange,
  readOnly = false,
  minHeight = '240px',
  placeholder,
}: JsEditorProps) {
  const [dark, setDark] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="overflow-hidden rounded border bg-[var(--muted)] text-sm">
      <CodeMirror
        value={value}
        {...(onChange ? { onChange } : {})}
        readOnly={readOnly}
        {...(placeholder ? { placeholder } : {})}
        theme={dark ? githubDark : githubLight}
        extensions={[javascript({ jsx: false, typescript: false }), baseTheme]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          autocompletion: !readOnly,
          highlightActiveLine: !readOnly,
        }}
        style={{ minHeight }}
      />
    </div>
  )
}
