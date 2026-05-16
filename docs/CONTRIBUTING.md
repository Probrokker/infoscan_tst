# Как контрибьютить

## Структура контента

Все статьи — `content/<sectionId>/<slug>.mdx`.

Frontmatter (обязателен):

```yaml
---
title: Заголовок статьи
description: Короткое описание (1–2 предложения)
audience: [operator] # operator | admin | developer (массив)
section: 03-network # совпадает с папкой
order: 4 # порядок в разделе
reading_minutes: 5 # оценка времени чтения
updated: 2026-05-15 # YYYY-MM-DD
related: [04-operation/startup] # связанные slug'и
status: published # published | draft
---
```

## Кастомные компоненты в MDX

### Callout

```mdx
<Callout kind="warning" title="Опционально">
  Текст предупреждения.
</Callout>
```

Виды: `note`, `tip`, `warning`, `danger`, `info`.

### Steps

```mdx
<Steps>
  <Step title="Заголовок шага 1">Описание.</Step>
  <Step title="Заголовок шага 2">Описание.</Step>
</Steps>
```

### CodeTabs

```mdx
<CodeTabs
  tabs={[
    {
      label: 'cURL',
      content: (
        <pre>
          <code>curl ...</code>
        </pre>
      ),
    },
    {
      label: 'JS',
      content: (
        <pre>
          <code>fetch(...)</code>
        </pre>
      ),
    },
  ]}
/>
```

### Mermaid

Просто пишите блок ```mermaid в обычном Markdown — он отрендерится в SVG на этапе сборки. CSP без `unsafe-eval` — рендер на сервере.

## Стиль

- Короткие абзацы, активный залог, повелительное наклонение для действий.
- Никакого канцелярита и пассивного залога. «Откройте файл» вместо «Файл должен быть открыт».
- Названия моделей всегда полные: «Инфоскан 3D 90», «Инфоскан Camera». Без сокращений.
- Имена JS-переменных и шаблонов — в моноширинном `code-блоке`.
- Контактные данные — только из `lib/constants.ts`. Никаких хардкодов.

## Тесты

- Юнит-тесты: `tests/unit/*.test.ts`. Запуск: `pnpm test`.
- E2E: `tests/e2e/*.spec.ts`. Запуск: `pnpm test:e2e`.
- При добавлении новой публичной утилиты в `lib/` — нужен юнит-тест.
- При добавлении нового маршрута — нужен smoke-test в Playwright.

## Коммиты

Conventional Commits обязательны:

```
feat: добавил статью про калибровку Camera
fix: исправил подсчёт времени чтения для MDX
docs: дополнил FAQ про объекты неправильной формы
refactor: вынес генератор шаблона в отдельный модуль
chore: обновил зависимости
```

Проверяется через commitlint в pre-commit-хуке.

## CI и Bugbot

Локально перед пушем имеет смысл прогнать то же, что делает GitHub Actions:

`pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm size`

**Cursor Bugbot** (проверка PR на баги) подключается в настройках Cursor для организации/репозитория и срабатывает на **pull request** в GitHub. Чтобы Bugbot посмотрел изменения: включи интеграцию для `infoscan_tst`, затем создай PR из ветки с правками — после анализа комментарии появятся в PR на GitHub.
