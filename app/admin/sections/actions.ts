'use server'

import { revalidatePath } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'
import slugify from 'slugify'

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

function revalidateSidebar() {
  revalidateTag('sidebar')
  revalidatePath('/admin/sections')
}

// ---- Sections ----

const sectionSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(500).optional(),
})

export async function createSectionAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const parsed = sectionSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const slug = slugify(parsed.data.title, { lower: true, strict: true })
    const exists = await prisma.section.findUnique({ where: { slug } })
    if (exists) return { ok: false, error: `Раздел со slug "${slug}" уже существует` }

    const last = await prisma.section.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const section = await prisma.section.create({
      data: {
        slug,
        title: parsed.data.title,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        order: (last?.order ?? 0) + 1,
      },
    })

    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'Section',
      entityId: section.id,
      ip,
    })
    revalidateSidebar()
    return { ok: true, id: section.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateSectionAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const parsed = sectionSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || undefined,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.section.update({
      where: { id },
      data: {
        title: parsed.data.title,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      },
    })

    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'Section',
      entityId: id,
      ip,
    })
    revalidateSidebar()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteSectionAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const count = await prisma.article.count({ where: { sectionId: id, deletedAt: null } })
    if (count > 0) return { ok: false, error: `Нельзя удалить: в разделе ${count} статей` }

    await prisma.section.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'Section',
      entityId: id,
      ip,
    })
    revalidateSidebar()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderSectionsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) => prisma.section.update({ where: { id }, data: { order: idx + 1 } })),
    )
    revalidateSidebar()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
