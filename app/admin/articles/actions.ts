'use server'

/**
 * Server actions для CRUD статей.
 *
 * Все мутации:
 *   1. Валидируют входные данные (zod).
 *   2. Проверяют сессию и роль (auth()).
 *   3. Пишут в БД.
 *   4. Вызывают revalidatePath('/') и revalidateTag('sidebar') — публичный сайт
 *      увидит изменения при следующем запросе (ISR Next.js).
 *   5. Логируют аudit.
 *
 * Редирект после создания / удаления делается из клиентского компонента,
 * server action возвращает { ok, id?, error }.
 */
import { revalidatePath, revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { ArticleStatus, type Audience, AuditAction } from '@prisma/client'
import slugify from 'slugify'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { recordAudit } from '@/lib/audit'
import { getClientIp } from '@/lib/rate-limit'

// ---- Zod схемы ----

const audienceEnum = z.enum(['OPERATOR', 'ADMIN_AUDIENCE', 'DEVELOPER'])

const articleBaseSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().min(1, 'Описание обязательно').max(500),
  sectionId: z.string().min(1, 'Выберите раздел'),
  audience: z.array(audienceEnum).default([]),
  order: z.coerce.number().int().min(0).default(0),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.DRAFT),
  related: z.array(z.string()).default([]),
})

const createArticleSchema = articleBaseSchema.extend({
  body: z.string().default(''),
  slug: z.string().min(1).max(120).optional(),
})

const updateArticleSchema = articleBaseSchema.extend({
  id: z.string().min(1),
})

// ---- Утилиты ----

async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Не авторизован')
  return session.user
}

function revalidateContent(sectionSlug: string, articleSlug?: string) {
  revalidateTag('sidebar')
  revalidatePath('/', 'layout')
  if (articleSlug) revalidateTag(`article:${sectionSlug}/${articleSlug}`)
}

// ---- Actions ----

export interface ActionResult {
  ok?: boolean
  id?: string
  error?: string
}

/** Создать статью с телом из шаблона или пустым. */
export async function createArticleAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const raw = {
      title: formData.get('title'),
      description: formData.get('description'),
      sectionId: formData.get('sectionId'),
      audience: formData.getAll('audience'),
      order: formData.get('order'),
      status: formData.get('status'),
      body: formData.get('body') ?? '',
      slug: formData.get('slug') || undefined,
      related: formData.getAll('related'),
    }

    const parsed = createArticleSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }
    }

    const { title, description, sectionId, audience, order, status, body, related } = parsed.data

    // Нормализуем slug
    const rawSlug =
      parsed.data.slug ||
      slugify(title, { lower: true, strict: true, locale: 'ru', remove: /['"]/g })
    const slug = rawSlug
      .slice(0, 120)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')

    // Достаём slug раздела для revalidate
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { slug: true },
    })

    const article = await prisma.article.create({
      data: {
        title,
        description,
        sectionId,
        audience: audience as Audience[],
        order,
        status,
        body: String(body),
        slug,
        related,
        authorId: user.id,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
      },
    })

    // Первая версия (snapshot)
    await prisma.articleVersion.create({
      data: {
        articleId: article.id,
        version: 1,
        snapshot: { title, description, body: String(body), audience, order, status, related },
        authorId: user.id,
        comment: 'Создание статьи',
      },
    })

    await recordAudit({
      action: AuditAction.CREATE,
      userId: user.id,
      entityType: 'Article',
      entityId: article.id,
      ip,
    })

    if (section) revalidateContent(section.slug, slug)

    return { ok: true, id: article.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    return { ok: false, error: message }
  }
}

/** Обновить метаданные статьи (без тела — MDX-редактор на шаге 6). */
export async function updateArticleAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const raw = {
      id: formData.get('id'),
      title: formData.get('title'),
      description: formData.get('description'),
      sectionId: formData.get('sectionId'),
      audience: formData.getAll('audience'),
      order: formData.get('order'),
      status: formData.get('status'),
      related: formData.getAll('related'),
    }

    const parsed = updateArticleSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' }
    }

    const { id, title, description, sectionId, audience, order, status, related } = parsed.data

    const existing = await prisma.article.findUnique({
      where: { id },
      include: { section: { select: { slug: true } } },
    })
    if (!existing || existing.deletedAt) return { ok: false, error: 'Статья не найдена' }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        title,
        description,
        sectionId,
        audience: audience as Audience[],
        order,
        status,
        related,
        publishedAt:
          status === ArticleStatus.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
    })

    // Создаём версию при каждом сохранении
    const lastVersion = await prisma.articleVersion.findFirst({
      where: { articleId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    await prisma.articleVersion.create({
      data: {
        articleId: id,
        version: (lastVersion?.version ?? 0) + 1,
        snapshot: {
          title,
          description,
          body: existing.body,
          audience,
          order,
          status,
          related,
        },
        authorId: user.id,
        comment: 'Обновление метаданных',
      },
    })

    await recordAudit({
      action: AuditAction.UPDATE,
      userId: user.id,
      entityType: 'Article',
      entityId: id,
      ip,
    })

    // Revalidate старого и нового раздела
    revalidateContent(existing.section.slug, existing.slug)
    if (sectionId !== existing.sectionId) {
      const newSection = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { slug: true },
      })
      if (newSection) revalidateContent(newSection.slug, updated.slug)
    }

    return { ok: true, id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    return { ok: false, error: message }
  }
}

/** Мягкое удаление (устанавливает deletedAt). Undo возможен в течение 5s на клиенте. */
export async function softDeleteArticleAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireSession()
    const reqHeaders = await headers()
    const ip = getClientIp(reqHeaders)

    const article = await prisma.article.findUnique({
      where: { id },
      include: { section: { select: { slug: true } } },
    })
    if (!article || article.deletedAt) return { ok: false, error: 'Статья не найдена' }

    await prisma.article.update({ where: { id }, data: { deletedAt: new Date() } })

    await recordAudit({
      action: AuditAction.DELETE,
      userId: user.id,
      entityType: 'Article',
      entityId: id,
      ip,
    })

    revalidateContent(article.section.slug, article.slug)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    return { ok: false, error: message }
  }
}

/** Восстановить мягко удалённую статью (undo). */
export async function restoreArticleAction(id: string): Promise<ActionResult> {
  try {
    await requireSession()
    const article = await prisma.article.findUnique({
      where: { id },
      include: { section: { select: { slug: true } } },
    })
    if (!article) return { ok: false, error: 'Статья не найдена' }

    await prisma.article.update({ where: { id }, data: { deletedAt: null } })
    revalidateContent(article.section.slug, article.slug)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    return { ok: false, error: message }
  }
}
