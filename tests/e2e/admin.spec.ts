import { test, expect } from '@playwright/test'

/**
 * E2E-тесты для admin-панели.
 *
 * Требуют запущенного dev/prod сервера с живой БД.
 * Переменные среды:
 *   ADMIN_EMAIL — email администратора (из .env)
 *   ADMIN_PASSWORD — пароль администратора
 *
 * Запуск: pnpm test:e2e -- --project=chromium tests/e2e/admin.spec.ts
 */

const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@inf-tec.ru'
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'ChangeMe!12345'

// ---- Хелпер: войти в админку ----
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Пароль').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /войти/i }).click()
  // Ждём редиректа на /admin
  await expect(page).toHaveURL(/\/admin$/, { timeout: 10_000 })
}

test.describe('Admin: аутентификация', () => {
  test('редиректит на /admin/login если не залогинен', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5_000 })
  })

  test('показывает ошибку при неверном пароле', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Пароль').fill('wrong-password-xyz')
    await page.getByRole('button', { name: /войти/i }).click()
    // Должно показаться сообщение об ошибке
    await expect(page.getByText(/неверный|ошибка|не найден/i)).toBeVisible({ timeout: 5_000 })
    // URL остаётся на логине
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('успешный вход перенаправляет на дашборд', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByRole('heading', { name: /дашборд/i })).toBeVisible()
  })
})

test.describe('Admin: список статей', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('страница /admin/articles загружается', async ({ page }) => {
    await page.goto('/admin/articles')
    await expect(page.getByRole('heading', { name: /статьи/i })).toBeVisible()
  })

  test('поиск фильтрует список статей', async ({ page }) => {
    await page.goto('/admin/articles')
    const search = page.getByPlaceholder(/поиск/i)
    await search.fill('Инфоскан')
    // Ждём применения фильтра (debounce или Enter)
    await search.press('Enter')
    await page.waitForLoadState('networkidle')
    // Таблица не должна содержать сообщение "ничего нет" если есть статьи с "Инфоскан"
    await expect(page.getByText(/ничего не найдено|no results/i)).not.toBeVisible()
  })
})

test.describe('Admin: разделы', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('страница /admin/sections загружается со списком', async ({ page }) => {
    await page.goto('/admin/sections')
    await expect(page.getByRole('heading', { name: /разделы/i })).toBeVisible()
    // Должен быть хоть один раздел (из seed)
    await expect(page.locator('.rounded-\\[var\\(--radius-card\\)\\].border').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('кнопка "Добавить раздел" открывает форму', async ({ page }) => {
    await page.goto('/admin/sections')
    await page.getByRole('button', { name: /добавить раздел/i }).click()
    await expect(page.getByPlaceholder(/название раздела/i)).toBeVisible()
  })
})

test.describe('Admin: справочники', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('страница /admin/reference показывает вкладки', async ({ page }) => {
    await page.goto('/admin/reference')
    await expect(page.getByRole('button', { name: /модели устройств/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /версии прошивок/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /переменные шаблонов/i })).toBeVisible()
  })

  test('переключение вкладок работает', async ({ page }) => {
    await page.goto('/admin/reference')
    await page.getByRole('button', { name: /версии прошивок/i }).click()
    // Вкладка активна — смотрим что кнопка "Добавить" доступна
    await expect(page.getByRole('button', { name: /добавить/i })).toBeVisible()
  })
})

test.describe('Admin: Git sync', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('страница /admin/git-sync загружается', async ({ page }) => {
    await page.goto('/admin/git-sync')
    await expect(page.getByRole('heading', { name: /sync to git/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sync to git/i })).toBeVisible()
  })
})

test.describe('Admin: бэкапы', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('страница /admin/backups загружается', async ({ page }) => {
    await page.goto('/admin/backups')
    await expect(page.getByRole('heading', { name: /резервные копии/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /создать бэкап/i })).toBeVisible()
  })
})
