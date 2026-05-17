'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { AuditAction, Role } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

export interface ActionResult {
  ok?: boolean
  error?: string
  id?: string
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  if (session.user.role !== 'ADMIN') throw new Error('Требуются права ADMIN')
  return session.user as { id: string; role: string }
}

// ---- Create user ----

const createSchema = z.object({
  email: z.string().email('Некорректный email'),
  name: z.string().min(1, 'Имя обязательно').max(100),
  password: z.string().min(8, 'Пароль минимум 8 символов'),
  role: z.nativeEnum(Role),
})

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const parsed = createSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
      password: formData.get('password'),
      role: formData.get('role') ?? Role.EDITOR,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (exists) return { ok: false, error: 'Пользователь с таким email уже существует' }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
      },
    })

    await recordAudit({
      action: AuditAction.USER_CREATE,
      userId: admin.id,
      entityType: 'User',
      entityId: user.id,
      ip: getClientIp(await headers()),
      details: { email: user.email, role: user.role },
    })

    revalidatePath('/admin/users')
    return { ok: true, id: user.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Update user (name + role) ----

const updateSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(100),
  role: z.nativeEnum(Role),
})

export async function updateUserAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const parsed = updateSchema.safeParse({
      name: formData.get('name'),
      role: formData.get('role') ?? Role.EDITOR,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    // Нельзя понизить самого себя
    if (id === admin.id && parsed.data.role !== Role.ADMIN) {
      return { ok: false, error: 'Нельзя снять у себя роль ADMIN' }
    }

    await prisma.user.update({
      where: { id },
      data: { name: parsed.data.name, role: parsed.data.role },
    })

    await recordAudit({
      action: AuditAction.USER_UPDATE,
      userId: admin.id,
      entityType: 'User',
      entityId: id,
      ip: getClientIp(await headers()),
      details: { name: parsed.data.name, role: parsed.data.role },
    })

    revalidatePath('/admin/users')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Change password ----

const passwordSchema = z.object({
  password: z.string().min(8, 'Пароль минимум 8 символов'),
})

export async function changePasswordAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()

    const parsed = passwordSchema.safeParse({ password: formData.get('password') })
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ошибка' }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    await prisma.user.update({ where: { id }, data: { passwordHash } })

    await recordAudit({
      action: AuditAction.PASSWORD_CHANGE,
      userId: admin.id,
      entityType: 'User',
      entityId: id,
      ip: getClientIp(await headers()),
      details: { changedBy: 'admin' },
    })

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

// ---- Deactivate / Restore (soft-delete) ----

export async function deactivateUserAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (id === admin.id) return { ok: false, error: 'Нельзя деактивировать самого себя' }

    await prisma.user.update({ where: { id }, data: { isActive: false } })

    await recordAudit({
      action: AuditAction.USER_DEACTIVATE,
      userId: admin.id,
      entityType: 'User',
      entityId: id,
      ip: getClientIp(await headers()),
    })

    revalidatePath('/admin/users')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}

export async function restoreUserAction(id: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    await prisma.user.update({ where: { id }, data: { isActive: true } })

    await recordAudit({
      action: AuditAction.USER_UPDATE,
      userId: admin.id,
      entityType: 'User',
      entityId: id,
      ip: getClientIp(await headers()),
      details: { restored: true },
    })

    revalidatePath('/admin/users')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ошибка' }
  }
}
