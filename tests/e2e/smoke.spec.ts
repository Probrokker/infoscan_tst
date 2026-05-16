import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('главная грузится и показывает три карточки', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Инфоскан/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Инфоскан')
    await expect(page.getByText('Я оператор')).toBeVisible()
    await expect(page.getByText('Я админ')).toBeVisible()
    await expect(page.getByText('Я разработчик')).toBeVisible()
  })

  test('страница статьи рендерится', async ({ page }) => {
    await page.goto('/01-start/what-is-infoscan')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Что такое Инфоскан')
  })

  test('Cmd+K открывает поиск', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+K')
    const input = page.getByPlaceholder('Поиск по статьям…')
    await expect(input).toBeVisible()
    await input.fill('измерение')
    // Должны появиться результаты
    await expect(page.getByText(/измерение/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('конструктор открывается', async ({ page }) => {
    await page.goto('/integration/builder')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Конструктор')
  })

  test('эмулятор открывается', async ({ page }) => {
    await page.goto('/emulator')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Эмулятор')
  })
})
