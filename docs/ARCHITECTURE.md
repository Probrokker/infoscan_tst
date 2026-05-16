# Архитектура

## Слои и зависимости

```
app/        ← роуты App Router, страницы
features/   ← тяжёлые фичи (builder, emulator, search)
components/ ← UI-примитивы и docs-компоненты
lib/        ← бизнес-логика, env, content, utils
types/      ← глобальные типы
```

Импорты идут **только сверху вниз**: `app/` → `features/` → `components/` → `lib/` → `types/`. ESLint правило `import/no-cycle` это проверяет.

## Feature-sliced

Каждая тяжёлая фича (`features/builder/`, `features/emulator/`, `features/search/`) — изолированный модуль:

```
features/<name>/
├── model/   ← Zustand-stores, Zod-схемы, машины состояний
├── ui/      ← React-компоненты фичи
├── lib/     ← вспомогательные функции
├── api/     ← (опционально) клиенты к внешним сервисам
└── index.ts ← публичный API
```

Из внешнего кода фича импортируется **только через `index.ts`**.

## Состояние

- **Конструктор**: Zustand с `persist` в `localStorage` (ключ `infoscan-docs:builder`).
- **Эмулятор**: Zustand без persist — эфемерная сессия.
- **Тема**: `next-themes`, атрибут `data-theme` на `<html>`.
- **Поиск**: статический индекс `public/search-index.json`, Fuse.js на клиенте.

## Контент

- MDX-файлы лежат в `content/<sectionId>/<slug>.mdx`.
- Frontmatter валидируется через Zod на этапе сборки (`lib/content.ts`).
- Сайдбар собирается автоматически по `frontmatter.section` и `frontmatter.order`.
- Кастомные компоненты в MDX: `<Callout>`, `<Steps>/<Step>`, `<CodeTabs>`, `<Mermaid>` — зарегистрированы в `mdx-components.tsx`.

## Безопасность

### Песочница эмулятора

Самая нетривиальная часть архитектуры. Эмулятор должен исполнять произвольный JS-код пользовательских шаблонов, но мы не хотим расслаблять CSP до `unsafe-eval` на основной странице.

Решение:

1. Создаём `<iframe>` с `sandbox="allow-scripts"` (БЕЗ `allow-same-origin`).
2. В iframe — небольшой HTML через `srcdoc`, который слушает `postMessage`.
3. Внутри iframe выполняем `new Function(...)` с пользовательским кодом — там это разрешено, потому что iframe изолирован.
4. Результат возвращаем через `postMessage` родителю.

Этот подход даёт:
- Нет сети из песочницы (нет `allow-same-origin` → пустой `origin` → `fetch` запрещён).
- Нет доступа к родительскому DOM/localStorage.
- Таймаут 5 секунд на исполнение (защита от бесконечных циклов).

### CSP

- Основная страница: `script-src 'self'`, `style-src 'self' 'unsafe-inline'` (для Tailwind inline-стилей).
- `/emulator`: `script-src 'self' 'wasm-unsafe-eval'`, `frame-src 'self'` (для iframe-песочницы).
- Все остальные заголовки — в `nginx.conf`.

### Валидация ввода

- Frontmatter → Zod в `lib/content.ts`.
- Состояние конструктора при гидрации из localStorage → Zod в `features/builder/model/store.ts`.
- Пользовательский ввод в эмуляторе → передаётся только в iframe, не рендерится напрямую.

## Сборка и деплой

- `output: 'export'` — полный статический билд.
- `out/` отдаётся через nginx (см. `Dockerfile` и `nginx.conf`).
- Все security-заголовки — в nginx (middleware не работает в `export`).
- Поисковый индекс собирается отдельно — `scripts/build-search.ts` в постхуке.

## Производительность

- Тяжёлые фичи (builder, emulator) — динамический импорт через `next/dynamic` с `ssr: false`.
- Иконки lucide-react — `experimental.optimizePackageImports` для tree-shaking.
- Шрифты — `next/font/google` с `display: swap`.
- Mermaid — рендер в SVG на этапе MDX-компиляции (не в браузере).
- Бандл-бюджет: 130 KB gzip на главной, 100 KB на статье (size-limit в CI).
