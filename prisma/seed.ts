/**
 * Seed-скрипт для первичного наполнения БД.
 *
 * Запуск: pnpm db:seed
 *
 * Что делает:
 *   1. Создаёт первого ADMIN из ENV ADMIN_EMAIL/ADMIN_PASSWORD (если нет).
 *   2. Создаёт 10 разделов из lib/constants.ts → SECTIONS.
 *   3. Создаёт DeviceModel из MODELS.
 *   4. Создаёт FirmwareVersion из VERSIONS (LITE/PRO — фактически product versions,
 *      Кирилл переименует/добавит реальные прошивки через UI на шаге 7).
 *   5. Создаёт TemplateVariable из TEMPLATE_VARIABLES.
 *   6. Сканирует content/<section-id>/<slug>.mdx, парсит frontmatter (gray-matter),
 *      создаёт Article (status: PUBLISHED) + первую ArticleVersion (snapshot).
 *   7. Создаёт 3 учебные дорожки (operator/admin/developer) из app/learning-paths.
 *
 * Идемпотентен: повторный запуск upsert'ит, не дублирует.
 *
 * Важно: на шаге 2 промта сказано «миграция текущего контента + удаление старых MDX».
 * Удаление content/ откладывается на шаг 3 (после переключения публичных маршрутов
 * на чтение из БД), чтобы можно было сравнить выдачу до/после.
 */
/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import {
  PrismaClient,
  ArticleStatus,
  Audience as AudienceEnum,
  Role,
  type Prisma,
} from '@prisma/client'
import { SECTIONS, MODELS, VERSIONS, TEMPLATE_VARIABLES } from '../lib/constants'

const prisma = new PrismaClient()
const CONTENT_DIR = path.join(process.cwd(), 'content')

// ---- Маппинги ----

const audienceMap: Record<string, AudienceEnum> = {
  operator: AudienceEnum.OPERATOR,
  admin: AudienceEnum.ADMIN_AUDIENCE,
  developer: AudienceEnum.DEVELOPER,
}

// ---- Учебные дорожки (источник: app/learning-paths/[role]/page.tsx) ----

interface LearningRoute {
  slug: string
  title: string
  description: string
  order: number
  steps: Array<{ articleSlug: string; notes?: string }>
}

const LEARNING_PATHS: LearningRoute[] = [
  {
    slug: 'operator',
    title: 'Маршрут «Оператор»',
    description: 'За 15 минут вы научитесь измерять груз на Инфоскане и решать частые ошибки.',
    order: 1,
    steps: [
      { articleSlug: '01-start/what-is-infoscan', notes: 'Что такое Инфоскан' },
      { articleSlug: '04-operation/startup', notes: 'Включение и проверка' },
      { articleSlug: '04-operation/measure-regular', notes: 'Измерение за 3 шага' },
      { articleSlug: '04-operation/history', notes: 'История измерений' },
      { articleSlug: '04-operation/errors', notes: 'Что делать при ошибке' },
    ],
  },
  {
    slug: 'admin',
    title: 'Маршрут «Админ»',
    description:
      'За 2 часа вы соберёте, подключите, откалибруете устройство и настроите Личный кабинет.',
    order: 2,
    steps: [
      { articleSlug: '02-assembly/unpacking', notes: 'Распаковка и комплектация' },
      { articleSlug: '02-assembly/stand', notes: 'Сборка стойки и платформы' },
      { articleSlug: '03-network/wired', notes: 'Проводное подключение' },
      { articleSlug: '03-network/personal-cabinet', notes: 'Доступ к Личному кабинету' },
      { articleSlug: '05-configuration/calibration-laser', notes: 'Калибровка ЛД' },
      { articleSlug: '05-configuration/calibration-weight', notes: 'Калибровка ВД' },
      { articleSlug: '05-configuration/settings', notes: 'Раздел «Настройки»' },
      { articleSlug: '07-service/maintenance', notes: 'Регламент обслуживания' },
    ],
  },
  {
    slug: 'developer',
    title: 'Маршрут «Разработчик»',
    description: 'За день вы соберёте полный шаблон интеграции с WMS и проверите его на эмуляторе.',
    order: 3,
    steps: [
      { articleSlug: '06-integration/architecture', notes: 'Архитектура шаблонов' },
      { articleSlug: '06-integration/runtime', notes: 'Среда выполнения JS' },
      { articleSlug: '06-integration/transports', notes: 'Транспорты' },
      { articleSlug: '06-integration/auth', notes: 'Аутентификация' },
      { articleSlug: '06-integration/finish-send', notes: 'Шаблон jsScriptFinishSend' },
      { articleSlug: '06-integration/error-handling', notes: 'Обработка ошибок' },
    ],
  },
]

// ---- Утилиты ----

function findMdxFiles(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      findMdxFiles(full, results)
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      results.push(full)
    }
  }
  return results
}

interface ArticleSeed {
  sectionSlug: string
  slug: string
  title: string
  description: string
  body: string
  audience: AudienceEnum[]
  order: number
  readingMinutes: number
  related: string[]
  status: ArticleStatus
  publishedAt: Date | null
}

function loadArticlesFromContent(): ArticleSeed[] {
  const files = findMdxFiles(CONTENT_DIR)
  const articles: ArticleSeed[] = []

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(raw)

    const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/')
    const segments = relative.replace(/\.mdx?$/, '').split('/')
    const sectionSlug = segments[0] ?? ''
    const articleSlug = segments.slice(1).join('/')
    if (!sectionSlug || !articleSlug) {
      console.warn(`[seed] пропускаю ${relative}: не могу определить section/slug`)
      continue
    }

    const fmAudience = Array.isArray(data['audience']) ? (data['audience'] as string[]) : []
    const audience = fmAudience
      .map((a) => audienceMap[a])
      .filter((v): v is AudienceEnum => v !== undefined)

    const fmRelated = Array.isArray(data['related']) ? (data['related'] as string[]) : []
    const fmStatus = typeof data['status'] === 'string' ? data['status'] : 'published'
    const status: ArticleStatus =
      fmStatus === 'draft' ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED

    const fmReadingMinutes =
      typeof data['reading_minutes'] === 'number' ? data['reading_minutes'] : null
    const calcMinutes = Math.max(1, Math.round(readingTime(content).minutes))
    const readingMinutesValue = fmReadingMinutes ?? calcMinutes

    const fmUpdated = data['updated']
    let publishedAt: Date | null = null
    if (status === ArticleStatus.PUBLISHED) {
      if (fmUpdated instanceof Date) {
        publishedAt = fmUpdated
      } else if (typeof fmUpdated === 'string' && fmUpdated.length > 0) {
        const parsed = new Date(fmUpdated)
        publishedAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed
      } else {
        publishedAt = new Date()
      }
    }

    articles.push({
      sectionSlug,
      slug: articleSlug,
      title: String(data['title'] ?? articleSlug),
      description: String(data['description'] ?? ''),
      body: content.trim(),
      audience,
      order: typeof data['order'] === 'number' ? data['order'] : 0,
      readingMinutes: readingMinutesValue,
      related: fmRelated,
      status,
      publishedAt,
    })
  }

  return articles
}

// ---- Основная логика ----

async function ensureAdmin(): Promise<string> {
  const email = process.env['ADMIN_EMAIL'] ?? 'admin@inf-tec.ru'
  const password = process.env['ADMIN_PASSWORD'] ?? 'ChangeMe!12345'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`[seed] ADMIN ${email} уже есть, пропускаю`)
    return existing.id
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const created = await prisma.user.create({
    data: {
      email,
      name: 'Кирилл Казарцев',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  })
  console.log(`[seed] создан ADMIN ${email}`)
  return created.id
}

async function seedSections(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const s of SECTIONS) {
    const upserted = await prisma.section.upsert({
      where: { slug: s.id },
      update: { title: s.title, order: s.order },
      create: { slug: s.id, title: s.title, order: s.order },
    })
    map.set(s.id, upserted.id)
  }
  console.log(`[seed] разделы: ${map.size}`)
  return map
}

async function seedDeviceModels(): Promise<void> {
  for (let i = 0; i < MODELS.length; i++) {
    const m = MODELS[i]!
    await prisma.deviceModel.upsert({
      where: { slug: m.id },
      update: { displayName: m.fullName, description: m.shortName, order: i + 1 },
      create: {
        slug: m.id,
        displayName: m.fullName,
        description: m.shortName,
        order: i + 1,
      },
    })
  }
  console.log(`[seed] модели устройств: ${MODELS.length}`)
}

async function seedFirmwareVersions(): Promise<void> {
  // VERSIONS в constants.ts — это product versions (LITE/PRO). Используем как
  // плейсхолдер для FirmwareVersion: Кирилл переименует/расширит через UI.
  for (let i = 0; i < VERSIONS.length; i++) {
    const v = VERSIONS[i]!
    await prisma.firmwareVersion.upsert({
      where: { slug: v.id },
      update: { displayName: v.name, order: i + 1 },
      create: {
        slug: v.id,
        displayName: v.name,
        order: i + 1,
      },
    })
  }
  console.log(`[seed] версии прошивок (плейсхолдер из VERSIONS): ${VERSIONS.length}`)
}

async function seedTemplateVariables(): Promise<void> {
  for (let i = 0; i < TEMPLATE_VARIABLES.length; i++) {
    const v = TEMPLATE_VARIABLES[i]!
    await prisma.templateVariable.upsert({
      where: { key: v.name },
      update: {
        type: v.type,
        displayName: v.name,
        description: v.description,
        example: v.example ?? null,
        order: i + 1,
      },
      create: {
        key: v.name,
        type: v.type,
        displayName: v.name,
        description: v.description,
        example: v.example ?? null,
        order: i + 1,
      },
    })
  }
  console.log(`[seed] переменные шаблона: ${TEMPLATE_VARIABLES.length}`)
}

async function seedArticles(adminId: string, sectionsMap: Map<string, string>): Promise<void> {
  const articles = loadArticlesFromContent()
  let created = 0
  let updated = 0

  for (const a of articles) {
    const sectionId = sectionsMap.get(a.sectionSlug)
    if (!sectionId) {
      console.warn(`[seed] пропускаю ${a.sectionSlug}/${a.slug}: нет такого раздела`)
      continue
    }

    const existing = await prisma.article.findUnique({
      where: { sectionId_slug: { sectionId, slug: a.slug } },
    })

    const baseData: Prisma.ArticleUncheckedCreateInput = {
      sectionId,
      slug: a.slug,
      title: a.title,
      description: a.description,
      body: a.body,
      audience: a.audience,
      order: a.order,
      readingMinutes: a.readingMinutes,
      related: a.related,
      status: a.status,
      publishedAt: a.publishedAt,
      authorId: adminId,
    }

    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: baseData,
      })
      updated++
    } else {
      const result = await prisma.article.create({ data: baseData })
      // Первая версия (snapshot для отката)
      await prisma.articleVersion.create({
        data: {
          articleId: result.id,
          version: 1,
          authorId: adminId,
          comment: 'Начальная версия (импорт из content/)',
          snapshot: {
            title: a.title,
            description: a.description,
            body: a.body,
            audience: a.audience,
            order: a.order,
            status: a.status,
            related: a.related,
          },
        },
      })
      created++
    }
  }

  console.log(`[seed] статьи: создано ${created}, обновлено ${updated}, всего ${articles.length}`)
}

async function seedLearningPaths(): Promise<void> {
  for (const path of LEARNING_PATHS) {
    const created = await prisma.learningPath.upsert({
      where: { slug: path.slug },
      update: {
        title: path.title,
        description: path.description,
        order: path.order,
        isPublished: true,
      },
      create: {
        slug: path.slug,
        title: path.title,
        description: path.description,
        order: path.order,
        isPublished: true,
      },
    })
    // Полная замена шагов: удаляем старые, создаём новые.
    await prisma.learningPathStep.deleteMany({ where: { pathId: created.id } })
    for (let i = 0; i < path.steps.length; i++) {
      const step = path.steps[i]!
      await prisma.learningPathStep.create({
        data: {
          pathId: created.id,
          articleSlug: step.articleSlug,
          order: i + 1,
          notes: step.notes ?? null,
        },
      })
    }
  }
  console.log(`[seed] учебные дорожки: ${LEARNING_PATHS.length}`)
}

async function main(): Promise<void> {
  console.log('[seed] старт')
  const adminId = await ensureAdmin()
  const sectionsMap = await seedSections()
  await seedDeviceModels()
  await seedFirmwareVersions()
  await seedTemplateVariables()
  await seedArticles(adminId, sectionsMap)
  await seedLearningPaths()
  console.log('[seed] готово')
}

main()
  .catch((err) => {
    console.error('[seed] ОШИБКА:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
