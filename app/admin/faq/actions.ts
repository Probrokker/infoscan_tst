'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

export interface ActionResult {
  ok?: boolean
  error?: string
  id?: string
}

async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return session.user as { id: string; role: string }
}

const faqSchema = z.object({
  question: z.string().min(1, 'Вопрос обязателен').max(500),
  answer: z.string().min(1, 'Ответ обязателен'),
  category: z.string().max(100).optional(),
  isPublished: z.boolean().optional(),
})

export async function createFaqItemAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = faqSchema.safeParse({
      question: formData.get('question'),
      answer: formData.get('answer'),
      category: formData.get('category') || undefined,
      isPublished: formData.get('isPublished') === 'true',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const last = await prisma.faqItem.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.faqItem.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        isPublished: parsed.data.isPublished ?? true,
        order: (last?.order ?? 0) + 1,
      },
    })
    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'FaqItem',
      entityId: item.id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/faq')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateFaqItemAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = faqSchema.safeParse({
      question: formData.get('question'),
      answer: formData.get('answer'),
      category: formData.get('category') || undefined,
      isPublished: formData.get('isPublished') === 'true',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.faqItem.update({
      where: { id },
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
        isPublished: parsed.data.isPublished ?? true,
      },
    })
    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'FaqItem',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/faq')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteFaqItemAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    await prisma.faqItem.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'FaqItem',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/faq')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderFaqItemsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) => prisma.faqItem.update({ where: { id }, data: { order: idx + 1 } })),
    )
    revalidatePath('/admin/faq')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
