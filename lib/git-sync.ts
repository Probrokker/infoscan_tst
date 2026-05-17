/**
 * lib/git-sync.ts — экспорт содержимого БД в MDX/JSON и push в git-репозиторий.
 *
 * Алгоритм:
 *   1. Создаём временный bare-checkout в /tmp/infoscan-sync-<timestamp>.
 *   2. Читаем из БД все published-статьи, разделы, FAQ, LearningPaths.
 *   3. Записываем MDX-файлы в content/<section>/<slug>.mdx.
 *   4. Записываем справочные данные в data/ как JSON.
 *   5. git add . && git commit && git push.
 *   6. Сохраняем GitSyncRun в БД.
 *   7. Убираем временную директорию.
 *
 * Требует GIT_REPO_URL и GIT_BRANCH в env.
 * В docker-контейнере репо уже склонировано; здесь мы делаем pull→export→push.
 */
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import simpleGit from 'simple-git'
import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'
import { recordAudit } from '@/lib/audit'

export interface GitSyncResult {
  ok: boolean
  commitSha?: string
  filesChanged: number
  durationMs: number
  errorText?: string
  message?: string
}

export async function runGitSync(triggeredByUserId?: string): Promise<GitSyncResult> {
  const startMs = Date.now()
  const repoUrl = process.env.GIT_REPO_URL
  const branch = process.env.GIT_BRANCH ?? 'main'

  if (!repoUrl) {
    return { ok: false, filesChanged: 0, durationMs: 0, errorText: 'GIT_REPO_URL не задан в .env' }
  }

  const tmpDir = path.join(os.tmpdir(), `infoscan-sync-${Date.now()}`)

  try {
    // Клонируем репо (shallow, только нужная ветка)
    await fs.mkdir(tmpDir, { recursive: true })
    const git = simpleGit()
    await git.clone(repoUrl, tmpDir, ['--branch', branch, '--depth', '1'])

    const repoGit = simpleGit(tmpDir)

    // Устанавливаем идентификатор для коммита
    await repoGit.addConfig('user.email', 'sync@infoscan.local')
    await repoGit.addConfig('user.name', 'Infoscan Sync Bot')

    // Читаем данные из БД
    const [
      articles,
      sections,
      faqItems,
      learningPaths,
      deviceModels,
      firmwareVersions,
      templateVars,
    ] = await Promise.all([
      prisma.article.findMany({
        where: { deletedAt: null, status: 'PUBLISHED' },
        include: { section: { select: { slug: true } } },
        orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }],
      }),
      prisma.section.findMany({ orderBy: { order: 'asc' } }),
      prisma.faqItem.findMany({ where: { isPublished: true }, orderBy: { order: 'asc' } }),
      prisma.learningPath.findMany({
        where: { isPublished: true },
        include: { steps: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      }),
      prisma.deviceModel.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.firmwareVersion.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.templateVariable.findMany({ orderBy: { order: 'asc' } }),
    ])

    let filesChanged = 0

    // content/<section>/<slug>.mdx
    const contentDir = path.join(tmpDir, 'content')
    await fs.mkdir(contentDir, { recursive: true })

    // Удаляем старые MDX-файлы чтобы не оставалось призраков
    for (const sec of sections) {
      const secDir = path.join(contentDir, sec.slug)
      await fs.rm(secDir, { recursive: true, force: true })
      await fs.mkdir(secDir, { recursive: true })
    }

    for (const article of articles) {
      const frontmatter = [
        '---',
        `title: "${article.title.replace(/"/g, '\\"')}"`,
        article.description ? `description: "${article.description.replace(/"/g, '\\"')}"` : null,
        `slug: "${article.slug}"`,
        `order: ${article.order}`,
        `status: ${article.status}`,
        article.audience.length > 0
          ? `audience: [${article.audience.map((a) => `"${a}"`).join(', ')}]`
          : null,
        article.related.length > 0
          ? `related: [${article.related.map((r) => `"${r}"`).join(', ')}]`
          : null,
        article.publishedAt ? `publishedAt: "${article.publishedAt.toISOString()}"` : null,
        '---',
        '',
      ]
        .filter((l) => l !== null)
        .join('\n')

      const mdxContent = frontmatter + article.body
      const filePath = path.join(contentDir, article.section.slug, `${article.slug}.mdx`)
      await fs.writeFile(filePath, mdxContent, 'utf-8')
      filesChanged++
    }

    // data/ — справочники как JSON
    const dataDir = path.join(tmpDir, 'data')
    await fs.mkdir(dataDir, { recursive: true })

    await fs.writeFile(
      path.join(dataDir, 'sections.json'),
      JSON.stringify(sections, null, 2),
      'utf-8',
    )
    await fs.writeFile(path.join(dataDir, 'faq.json'), JSON.stringify(faqItems, null, 2), 'utf-8')
    await fs.writeFile(
      path.join(dataDir, 'learning-paths.json'),
      JSON.stringify(learningPaths, null, 2),
      'utf-8',
    )
    await fs.writeFile(
      path.join(dataDir, 'device-models.json'),
      JSON.stringify(deviceModels, null, 2),
      'utf-8',
    )
    await fs.writeFile(
      path.join(dataDir, 'firmware-versions.json'),
      JSON.stringify(firmwareVersions, null, 2),
      'utf-8',
    )
    await fs.writeFile(
      path.join(dataDir, 'template-variables.json'),
      JSON.stringify(templateVars, null, 2),
      'utf-8',
    )
    filesChanged += 6

    // Git commit & push
    await repoGit.add('.')
    const status = await repoGit.status()

    const durationMs = Date.now() - startMs

    if (status.isClean()) {
      // Нет изменений — это нормально
      await prisma.gitSyncRun.create({
        data: {
          status: 'success',
          message: 'Нет изменений для коммита',
          filesChanged: 0,
          durationMs,
          ...(triggeredByUserId ? { triggeredBy: triggeredByUserId } : {}),
        },
      })
      await fs.rm(tmpDir, { recursive: true, force: true })
      return { ok: true, filesChanged: 0, durationMs, message: 'Нет изменений' }
    }

    const commitMsg = `sync: export db content ${new Date().toISOString().slice(0, 10)}`
    await repoGit.commit(commitMsg)
    await repoGit.push('origin', branch)

    const log = await repoGit.log({ maxCount: 1 })
    const commitSha = log.latest?.hash?.slice(0, 8) ?? ''

    await prisma.gitSyncRun.create({
      data: {
        status: 'success',
        commitSha,
        message: commitMsg,
        filesChanged,
        durationMs,
        ...(triggeredByUserId ? { triggeredBy: triggeredByUserId } : {}),
      },
    })

    if (triggeredByUserId) {
      await recordAudit({
        action: AuditAction.GIT_SYNC,
        userId: triggeredByUserId,
        entityType: 'GitSyncRun',
        details: { commitSha, filesChanged },
      })
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
    return { ok: true, commitSha, filesChanged, durationMs }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error)
    const durationMs = Date.now() - startMs

    await prisma.gitSyncRun.create({
      data: {
        status: 'failure',
        errorText: errorText.slice(0, 2000),
        filesChanged: 0,
        durationMs,
        ...(triggeredByUserId ? { triggeredBy: triggeredByUserId } : {}),
      },
    })

    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined)
    return { ok: false, filesChanged: 0, durationMs, errorText }
  }
}
