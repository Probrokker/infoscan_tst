'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'
import { generateCode } from '@/lib/js-constructor-types'
import type { JsTemplateData, WizardState } from '@/lib/js-constructor-types'

export interface ActionResult {
  ok?: boolean
  error?: string
  id?: string
  slug?: string
}

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return session.user as { id: string; role: string }
}

// ----------------------------------------------------------------
// JS Templates CRUD
// ----------------------------------------------------------------

const templateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Только a-z, 0-9, дефис'),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  code: z.string(),
  params: z.string().default('[]'),
  stages: z.string().default('[]'),
  compatibleWith: z.string().default(''),
  order: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
})

export async function createTemplateAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const raw = Object.fromEntries(formData.entries())
    const parsed = templateSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const d = parsed.data
    const compatibleWith = d.compatibleWith
      ? d.compatibleWith
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    let params: object
    let stages: object
    try {
      params = JSON.parse(d.params) as object
      stages = JSON.parse(d.stages) as object
    } catch {
      return { ok: false, error: 'Некорректный JSON в params или stages' }
    }

    const template = await prisma.jsTemplate.create({
      data: {
        slug: d.slug,
        name: d.name,
        description: d.description ?? null,
        category: d.category,
        version: d.version,
        code: d.code,
        params,
        stages,
        compatibleWith,
        order: d.order,
        isActive: d.isActive,
      },
    })

    await recordAudit({
      action: AuditAction.JS_TEMPLATE_CREATE,
      userId: user.id,
      entityType: 'JsTemplate',
      entityId: template.id,
      ip: getClientIp(await headers()),
      details: { name: template.name, category: template.category },
    })

    revalidatePath('/admin/js-constructor/templates')
    return { ok: true, id: template.id, slug: template.slug }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function updateTemplateAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const raw = Object.fromEntries(formData.entries())
    const parsed = templateSchema.safeParse(raw)
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const d = parsed.data
    const compatibleWith = d.compatibleWith
      ? d.compatibleWith
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    let params: object
    let stages: object
    try {
      params = JSON.parse(d.params) as object
      stages = JSON.parse(d.stages) as object
    } catch {
      return { ok: false, error: 'Некорректный JSON в params или stages' }
    }

    await prisma.jsTemplate.update({
      where: { id },
      data: {
        slug: d.slug,
        name: d.name,
        description: d.description ?? null,
        category: d.category,
        version: d.version,
        code: d.code,
        params,
        stages,
        compatibleWith,
        order: d.order,
        isActive: d.isActive,
      },
    })

    await recordAudit({
      action: AuditAction.JS_TEMPLATE_UPDATE,
      userId: user.id,
      entityType: 'JsTemplate',
      entityId: id,
      ip: getClientIp(await headers()),
    })

    revalidatePath('/admin/js-constructor/templates')
    revalidatePath(`/admin/js-constructor/templates/${id}`)
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    await prisma.jsTemplate.delete({ where: { id } })

    await recordAudit({
      action: AuditAction.JS_TEMPLATE_DELETE,
      userId: user.id,
      entityType: 'JsTemplate',
      entityId: id,
      ip: getClientIp(await headers()),
    })

    revalidatePath('/admin/js-constructor/templates')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function toggleTemplateActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await requireAuth()
    await prisma.jsTemplate.update({ where: { id }, data: { isActive } })
    revalidatePath('/admin/js-constructor/templates')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ----------------------------------------------------------------
// JS Configs CRUD
// ----------------------------------------------------------------

const configMetaSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(1000).optional(),
  clientName: z.string().max(200).optional(),
})

export async function saveConfigAction(
  wizardState: WizardState,
  templates: JsTemplateData[],
  existingId?: string,
): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const metaParsed = configMetaSchema.safeParse({
      name: wizardState.name,
      description: wizardState.description,
      clientName: wizardState.clientName,
    })
    if (!metaParsed.success)
      return { ok: false, error: metaParsed.error.errors[0]?.message ?? 'Ошибка' }

    const orderedTemplates = wizardState.selectedIds
      .map((id) => templates.find((t) => t.id === id))
      .filter(Boolean) as JsTemplateData[]

    const generatedCode = generateCode(
      orderedTemplates,
      wizardState.values,
      wizardState.connections,
    )

    const slug = existingId
      ? undefined
      : `config-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    if (existingId) {
      const config = await prisma.jsConfig.update({
        where: { id: existingId },
        data: {
          name: metaParsed.data.name,
          description: metaParsed.data.description ?? null,
          clientName: metaParsed.data.clientName ?? null,
          templateIds: wizardState.selectedIds,
          connections: wizardState.connections,
          values: wizardState.values,
          generatedCode,
          templates: {
            deleteMany: {},
            create: wizardState.selectedIds.map((tid, idx) => ({
              templateId: tid,
              position: idx,
            })),
          },
        },
      })

      await recordAudit({
        action: AuditAction.JS_CONFIG_UPDATE,
        userId: user.id,
        entityType: 'JsConfig',
        entityId: config.id,
        ip: getClientIp(await headers()),
        details: { name: config.name },
      })

      revalidatePath('/admin/js-constructor')
      revalidatePath(`/admin/js-constructor/${existingId}`)
      return { ok: true, id: config.id, slug: config.slug }
    } else {
      const config = await prisma.jsConfig.create({
        data: {
          slug: slug!,
          name: metaParsed.data.name,
          description: metaParsed.data.description ?? null,
          clientName: metaParsed.data.clientName ?? null,
          templateIds: wizardState.selectedIds,
          connections: wizardState.connections,
          values: wizardState.values,
          generatedCode,
          createdById: user.id,
          templates: {
            create: wizardState.selectedIds.map((tid, idx) => ({
              templateId: tid,
              position: idx,
            })),
          },
        },
      })

      await recordAudit({
        action: AuditAction.JS_CONFIG_CREATE,
        userId: user.id,
        entityType: 'JsConfig',
        entityId: config.id,
        ip: getClientIp(await headers()),
        details: { name: config.name, clientName: config.clientName },
      })

      revalidatePath('/admin/js-constructor')
      return { ok: true, id: config.id, slug: config.slug }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function deleteConfigAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    await prisma.jsConfig.delete({ where: { id } })

    await recordAudit({
      action: AuditAction.JS_CONFIG_DELETE,
      userId: user.id,
      entityType: 'JsConfig',
      entityId: id,
      ip: getClientIp(await headers()),
    })

    revalidatePath('/admin/js-constructor')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function duplicateConfigAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()
    const original = await prisma.jsConfig.findUnique({ where: { id } })
    if (!original) return { ok: false, error: 'Конфигурация не найдена' }

    const newSlug = `config-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const copy = await prisma.jsConfig.create({
      data: {
        slug: newSlug,
        name: `${original.name} (копия)`,
        description: original.description,
        clientName: original.clientName,
        templateIds: original.templateIds,
        connections: original.connections ?? {},
        values: original.values ?? {},
        generatedCode: original.generatedCode,
        createdById: user.id,
        templates: {
          create: original.templateIds.map((tid, idx) => ({
            templateId: tid,
            position: idx,
          })),
        },
      },
    })

    revalidatePath('/admin/js-constructor')
    return { ok: true, id: copy.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
