import Link from 'next/link'
import { TemplateForm } from '../TemplateForm'

export const metadata = { title: 'Новый шаблон — Инфоскан Admin' }

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link href="/admin/js-constructor" className="hover:text-[var(--foreground)]">
            Конструктор JS
          </Link>
          <span>/</span>
          <Link href="/admin/js-constructor/templates" className="hover:text-[var(--foreground)]">
            Шаблоны
          </Link>
          <span>/</span>
          <span>Новый</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold">Новый шаблон</h1>
      </div>
      <TemplateForm />
    </div>
  )
}
