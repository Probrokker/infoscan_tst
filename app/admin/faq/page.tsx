import { prisma } from '@/lib/prisma'
import { FaqClient } from './FaqClient'

export const metadata = { title: 'FAQ — Инфоскан Admin' }

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({ orderBy: { order: 'asc' } })
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FAQ</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Часто задаваемые вопросы. Перетащи строку для изменения порядка.
        </p>
      </div>
      <FaqClient items={items} />
    </div>
  )
}
