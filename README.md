# База знаний «Инфоскан»

Документация и интерактивные инструменты для устройств измерения габаритов и веса Инфоскан (3D 60 / 3D 90 / Camera, версии LITE / PRO).

Сайт решает четыре задачи: объясняет продукт людям с нулевой подготовкой, ведёт за руку при сборке и настройке, даёт интегратору всё для подключения к WMS клиента, позволяет интерактивно собрать JS-шаблон интеграции и проверить его на эмуляторе устройства.

## Стек

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict).
- **Контент**: MDX через `@next/mdx`, `remark-gfm`, `rehype-pretty-code` (Shiki), `@theguild/remark-mermaid`.
- **Стили**: Tailwind CSS v4 + `@tailwindcss/typography`.
- **Компоненты**: shadcn/ui на Radix UI + lucide-react.
- **Состояние интерактивов**: Zustand 5 (`features/builder/`, `features/emulator/`).
- **Поиск**: pagefind (статический индекс, генерируется в `postbuild`).
- **Темы**: next-themes (светлая/тёмная, по системе).
- **Деплой**: Dockerfile + docker-compose, статика раздаётся nginx из `out/`.

## Предусловия

- Node.js **>= 20.0.0** (рекомендация — последний LTS).
- pnpm **>= 9.0.0** (включается через `corepack enable`).
- Docker и docker compose — только для прод-сборки.

## Установка

```bash
git clone <repo-url> infoscan-docs
cd infoscan-docs
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

## Разработка

```bash
pnpm dev          # запускает Next.js на http://localhost:3000
pnpm typecheck    # проверка типов
pnpm lint         # ESLint flat-config
pnpm format       # Prettier
pnpm stylelint    # Stylelint для CSS
pnpm test         # юнит-тесты (Vitest)
pnpm test:e2e     # e2e через Playwright (нужен запущенный dev/build)
```

## Билд

```bash
pnpm build        # next build + сборка pagefind-индекса
pnpm start        # next start (для отладки прод-режима)
pnpm size         # проверка бандл-бюджета (130KB / 100KB gzip)
pnpm analyze      # bundle-analyzer
```

После `pnpm build` собранная статика лежит в `out/` — её и раздаёт nginx.

## Деплой через Docker

```bash
docker compose up -d --build      # сборка + старт на 80 порту
docker compose logs -f docs       # логи nginx
```

В `docker-compose.yml` контейнер `docs`: multi-stage Dockerfile собирает Next, во второй стадии копирует `out/` в `nginx:1.27-alpine`. Все security-заголовки (CSP, HSTS, X-Content-Type-Options, Permissions-Policy и др.) описаны в `nginx.conf`.

Для прод-домена пробросьте 443 и подключите сертификат через reverse-proxy или Caddy/Traefik перед nginx.

## Структура

```
infoscan-docs/
├── app/                  # App Router: layout, главная, страницы статей, builder, emulator
├── components/
│   ├── ui/               # shadcn-компоненты (Button, Card, Tabs, ...)
│   ├── docs/             # AudienceBadge, Callout, Steps, CodeTabs, Mermaid
│   ├── layout/           # Header, Sidebar, Footer, ThemeToggle, SearchTrigger
│   └── shared/
├── features/
│   ├── builder/          # конструктор JS-шаблона (model/Zustand, ui, lib, api)
│   ├── emulator/         # эмулятор экранов устройства
│   └── search/           # Cmd+K модалка
├── content/              # MDX-статьи по разделам 01-start … 10-reference
├── lib/                  # content.ts, env.ts (Zod), constants.ts, observability.ts, utils.ts
├── types/                # глобальные типы (mdx.d.ts и т.п.)
├── public/               # logo.svg, illustrations/, downloads/, fonts/
├── scripts/              # build-search.ts, optimize-images.ts
├── tests/
│   ├── unit/             # Vitest
│   └── e2e/              # Playwright
├── docs/                 # ARCHITECTURE.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── next.config.mjs
├── tailwind.config.ts (нет — Tailwind v4 живёт в globals.css через @theme)
├── postcss.config.mjs
└── tsconfig.json
```

## Как добавить новую статью

1. Положи файл `content/<раздел>/<имя>.mdx` (раздел — одна из существующих папок `01-start` … `10-reference`).
2. Заполни frontmatter:

```yaml
---
title: Подключение устройства к Личному кабинету
description: Доступ к веб-интерфейсу Инфоскан 3D 90 по IP-адресу за 5 минут
audience: [admin] # operator | admin | developer
section: 03-network
order: 4
reading_minutes: 5
updated: 2026-05-15
related: [04-operation/01-startup, 03-network/03-firewall]
status: published # или draft — тогда в шапке появится плашка
---
```

3. Пиши контент. Доступны компоненты: `<Callout>`, `<Steps>`, `<CodeTabs>`, `<Mermaid>` — описание в `docs/CONTRIBUTING.md`.
4. Сайдбар собирается автоматически по `frontmatter.section` и `frontmatter.order`. Никаких ручных правок дерева не нужно.

## Как обновить конструктор / эмулятор

- Конструктор: код в `features/builder/`. Шаги конструктора — отдельные компоненты в `features/builder/ui/steps/`. Состояние — `features/builder/model/store.ts` (Zustand с `persist` в `localStorage`).
- Эмулятор: код в `features/emulator/`. Экраны — отдельные компоненты в `features/emulator/ui/screens/`. Машина состояний — `features/emulator/model/machine.ts` (явный объект `{ state, transitions }`).

Изменения в публичный API фич — только через `features/<name>/index.ts`.

## Контакты

ООО «Инфотех»

- **E-mail**: [sales@inf-tec.ru](mailto:sales@inf-tec.ru)
- **Телефон**: +7 (495) 995 59 13
- **Telegram**: [@kazartsevk](https://t.me/kazartsevk)
- **На рынке с 2015 года.**
