'use server'

import { revalidatePath } from 'next/cache'
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

const pathSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().min(1, 'Описание обязательно').max(1000),
  isPublished: z.boolean().optional(),
})

export async function createLearningPathAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = pathSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      isPublished: formData.get('isPublished') === 'true',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const slug = slugify(parsed.data.title, { lower: true, strict: true })
    const exists = await prisma.learningPath.findUnique({ where: { slug } })
    if (exists) return { ok: false, error: `Путь "${slug}" уже существует` }

    const last = await prisma.learningPath.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.learningPath.create({
      data: {
        slug,
        title: parsed.data.title,
        description: parsed.data.description,
        order: (last?.order ?? 0) + 1,
        isPublished: parsed.data.isPublished ?? false,
      },
    })
    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'LearningPath',
      entityId: item.id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/learning-paths')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateLearningPathAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = pathSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      isPublished: formData.get('isPublished') === 'true',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.learningPath.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        isPublished: parsed.data.isPublished ?? false,
      },
    })
    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'LearningPath',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/learning-paths')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteLearningPathAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    await prisma.learningPath.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'LearningPath',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/learning-paths')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderLearningPathsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) => prisma.learningPath.update({ where: { id }, data: { order: idx + 1 } })),
    )
    revalidatePath('/admin/learning-paths')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Steps ----

const stepSchema = z.object({
  articleSlug: z.string().min(1, 'Slug статьи обязателен'),
  notes: z.string().max(500).optional(),
})

export async function addLearningPathStepAction(
  pathId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSession()
    const parsed = stepSchema.safeParse({
      articleSlug: formData.get('articleSlug'),
      notes: formData.get('notes') || undefined,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const last = await prisma.learningPathStep.findFirst({
      where: { pathId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.learningPathStep.create({
      data: {
        pathId,
        articleSlug: parsed.data.articleSlug,
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        order: (last?.order ?? 0) + 1,
      },
    })
    revalidatePath('/admin/learning-paths')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteLearningPathStepAction(id: string): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.learningPathStep.delete({ where: { id } })
    revalidatePath('/admin/learning-paths')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderLearningPathStepsAction(
  _pathId: string,
  ids: string[],
): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) =>
        prisma.learningPathStep.update({ where: { id }, data: { order: idx + 1 } }),
      ),
    )
    revalidatePath('/admin/learning-paths')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
