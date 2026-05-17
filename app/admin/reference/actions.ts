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

const modelSchema = z.object({
  displayName: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
})

export async function createDeviceModelAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = modelSchema.safeParse({
      displayName: formData.get('displayName'),
      description: formData.get('description') || undefined,
      isActive: formData.get('isActive') !== 'false',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const slug = slugify(parsed.data.displayName, { lower: true, strict: true })
    const exists = await prisma.deviceModel.findUnique({ where: { slug } })
    if (exists) return { ok: false, error: `Модель "${slug}" уже существует` }

    const last = await prisma.deviceModel.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.deviceModel.create({
      data: {
        slug,
        displayName: parsed.data.displayName,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        order: (last?.order ?? 0) + 1,
      },
    })
    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'DeviceModel',
      entityId: item.id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateDeviceModelAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = modelSchema.safeParse({
      displayName: formData.get('displayName'),
      description: formData.get('description') || undefined,
      isActive: formData.get('isActive') !== 'false',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.deviceModel.update({
      where: { id },
      data: {
        displayName: parsed.data.displayName,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        isActive: parsed.data.isActive ?? true,
      },
    })
    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'DeviceModel',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteDeviceModelAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    await prisma.deviceModel.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'DeviceModel',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderDeviceModelsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) => prisma.deviceModel.update({ where: { id }, data: { order: idx + 1 } })),
    )
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Firmware Versions ----

const firmwareSchema = z.object({
  displayName: z.string().min(1, 'Название обязательно').max(200),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
})

export async function createFirmwareVersionAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = firmwareSchema.safeParse({
      displayName: formData.get('displayName'),
      notes: formData.get('notes') || undefined,
      isActive: formData.get('isActive') !== 'false',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const slug = slugify(parsed.data.displayName, { lower: true, strict: true })
    const exists = await prisma.firmwareVersion.findUnique({ where: { slug } })
    if (exists) return { ok: false, error: `Версия "${slug}" уже существует` }

    const last = await prisma.firmwareVersion.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.firmwareVersion.create({
      data: {
        slug,
        displayName: parsed.data.displayName,
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        order: (last?.order ?? 0) + 1,
      },
    })
    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'FirmwareVersion',
      entityId: item.id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateFirmwareVersionAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = firmwareSchema.safeParse({
      displayName: formData.get('displayName'),
      notes: formData.get('notes') || undefined,
      isActive: formData.get('isActive') !== 'false',
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.firmwareVersion.update({
      where: { id },
      data: {
        displayName: parsed.data.displayName,
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        isActive: parsed.data.isActive ?? true,
      },
    })
    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'FirmwareVersion',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteFirmwareVersionAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    await prisma.firmwareVersion.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'FirmwareVersion',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderFirmwareVersionsAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) =>
        prisma.firmwareVersion.update({ where: { id }, data: { order: idx + 1 } }),
      ),
    )
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Template Variables ----

const varSchema = z.object({
  key: z
    .string()
    .min(1, 'Ключ обязателен')
    .max(100)
    .regex(/^[A-Z_]+$/, 'Только заглавные буквы и _'),
  displayName: z.string().min(1, 'Название обязательно').max(200),
  type: z.string().min(1),
  description: z.string().max(500).optional(),
  example: z.string().max(200).optional(),
})

export async function createTemplateVariableAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = varSchema.safeParse({
      key: formData.get('key'),
      displayName: formData.get('displayName'),
      type: formData.get('type') ?? 'string',
      description: formData.get('description') || undefined,
      example: formData.get('example') || undefined,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const exists = await prisma.templateVariable.findUnique({ where: { key: parsed.data.key } })
    if (exists) return { ok: false, error: `Переменная "${parsed.data.key}" уже существует` }

    const last = await prisma.templateVariable.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await prisma.templateVariable.create({
      data: {
        key: parsed.data.key,
        displayName: parsed.data.displayName,
        type: parsed.data.type,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.example !== undefined ? { example: parsed.data.example } : {}),
        order: (last?.order ?? 0) + 1,
      },
    })
    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'TemplateVariable',
      entityId: item.id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true, id: item.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateTemplateVariableAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const parsed = varSchema.safeParse({
      key: formData.get('key'),
      displayName: formData.get('displayName'),
      type: formData.get('type') ?? 'string',
      description: formData.get('description') || undefined,
      example: formData.get('example') || undefined,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    await prisma.templateVariable.update({
      where: { id },
      data: {
        key: parsed.data.key,
        displayName: parsed.data.displayName,
        type: parsed.data.type,
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.example !== undefined ? { example: parsed.data.example } : {}),
      },
    })
    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'TemplateVariable',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteTemplateVariableAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    await prisma.templateVariable.delete({ where: { id } })
    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'TemplateVariable',
      entityId: id,
      ip: getClientIp(await headers()),
    })
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function reorderTemplateVariablesAction(ids: string[]): Promise<ActionResult> {
  try {
    await requireSession()
    await prisma.$transaction(
      ids.map((id, idx) =>
        prisma.templateVariable.update({ where: { id }, data: { order: idx + 1 } }),
      ),
    )
    revalidatePath('/admin/reference')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
