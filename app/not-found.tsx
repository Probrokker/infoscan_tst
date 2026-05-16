/**
 * Кастомная 404. Статически генерируется в out/404.html.
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-sm text-[var(--muted-foreground)]">404</p>
      <h1 className="mt-2 text-3xl font-bold">Страница не найдена</h1>
      <p className="mt-3 text-[var(--muted-foreground)]">
        Возможно, ссылка устарела или статья ещё не написана. Попробуйте поиск или
        вернитесь на главную.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    </div>
  )
}
