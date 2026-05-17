# HANDOFF: База знаний «Инфоскан» + Админ-панель

Передача проекта между AI-агентами. Пользователь — Кирилл Казарцев, CEO «Инфотех», не программист.
Объясняй простыми словами, проверяй каждое действие, не запускай ничего деструктивного без подтверждения.

---

## TL;DR (актуально на 2026-05-17)

**Что работает:**

- Сайт: Next.js 15, `output: 'standalone'`, развёрнут на VPS `178.72.170.189` через Docker Compose.
- Стек: `postgres` (БД) + `migrator` (prisma migrate) + `app` (Node 3000) + `nginx` (80) + `backup` (pg_dump раз в сутки).
- Контент хранится в PostgreSQL (не в MDX-файлах). Исходные MDX перенесены в БД через `prisma/seed.ts`.
- Публичный сайт читает статьи из БД с ISR (`revalidate: 3600`). On-demand revalidation через `revalidateTag`.
- Админ-панель: `/admin` (Auth.js v5, роли ADMIN/EDITOR). Вход: email + пароль.
- GitHub: `https://github.com/Probrokker/infoscan_tst`. Автодеплой: `auto-deploy.sh` через cron.

**Что умеет админка:**

- Статьи: CRUD + MDX-редактор (CodeMirror) + превью + публикация + история версий + откат
- Разделы: CRUD + drag-and-drop порядок
- Справочники: Модели устройств, Версии прошивок, Переменные шаблонов
- Учебные пути: CRUD + шаги + привязка к статьям
- FAQ: CRUD + drag-and-drop
- Пользователи (ADMIN): создание, редактирование, смена пароля, деактивация с undo
- Аудит-лог (ADMIN): история всех изменений с фильтрами
- Git sync: экспорт контента в git-репозиторий как MDX/JSON
- Бэкапы (ADMIN): pg_dump / pg_restore через UI

---

## Первый запуск на новом VPS (пошаговая инструкция)

### 1. Подготовь `.env`

Скопируй `.env.example` в `.env` и заполни все значения:

```bash
cp .env.example .env
nano .env
```

Обязательные переменные:

| Переменная             | Пример                    | Описание                 |
| ---------------------- | ------------------------- | ------------------------ |
| `POSTGRES_PASSWORD`    | `Abc1234!`                | Пароль PostgreSQL        |
| `NEXTAUTH_SECRET`      | `openssl rand -hex 32`    | Секрет JWT (32+ символа) |
| `NEXTAUTH_URL`         | `http://docs.inf-tec.ru`  | Полный URL сайта         |
| `NEXT_PUBLIC_SITE_URL` | `https://docs.inf-tec.ru` | Для sitemap / RSS        |
| `ADMIN_EMAIL`          | `admin@inf-tec.ru`        | Email первого admin      |
| `ADMIN_PASSWORD`       | `SecurePass!123`          | Пароль первого admin     |

Опциональные (для Git Sync):

| Переменная     | Пример                                       |
| -------------- | -------------------------------------------- |
| `GIT_REPO_URL` | `git@github.com:Probrokker/infoscan_tst.git` |
| `GIT_BRANCH`   | `main`                                       |

### 2. SSH deploy key для Git Sync (если нужен)

```bash
mkdir -p secrets
ssh-keygen -t ed25519 -C "infoscan-git-sync" -f secrets/git_ssh_key -N ""
# Добавь secrets/git_ssh_key.pub в репозиторий → Settings → Deploy keys
```

`secrets/` уже в `.gitignore` — ключ не попадёт в git.

### 3. Первый запуск

```bash
# На VPS (или локально с Docker):
docker compose --profile full up -d --build
```

При первом запуске `migrator` автоматически:

1. Запустит `prisma migrate deploy` (создаст таблицы)
2. Выйдет с кодом 0

После — `app` поднимется, выполнит проверку `/api/health`.

### 4. Seed (заполнение начальными данными)

Если нужно перенести статьи из MDX или создать первого пользователя:

```bash
docker compose exec app node -e "require('./node_modules/.bin/tsx'); require('./prisma/seed.ts')"
# ИЛИ если seed уже встроен:
docker compose exec app npx tsx prisma/seed.ts
```

> **Seed идемпотентен** — можно запускать несколько раз без дублирования данных.

### 5. Проверь что всё работает

```bash
curl -sf http://localhost/api/health   # должен вернуть {"status":"ok","db":"ok"}
curl -sf http://localhost/             # главная страница (HTML)
```

Откройте в браузере: `http://ВАШ-IP/admin/login` → войдите с `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Обновление на существующем VPS

Обычный flow — `git push` → cron сам всё подтянет:

```bash
git push origin main
```

Cron (каждые 5 минут) запускает `auto-deploy.sh`:

1. `git fetch && git pull --ff-only`
2. `docker compose --profile full up -d --build`
3. Smoke-check `/api/health` (60 сек)

Посмотреть лог деплоя:

```bash
ssh root@178.72.170.189 'tail -50 /var/log/infoscan-deploy.log'
```

Статус контейнеров:

```bash
ssh root@178.72.170.189 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### Миграции БД (при изменении schema.prisma)

```bash
# Локально — создать migration:
pnpm db:migrate     # prisma migrate dev --name <описание>
git add prisma/migrations/ && git commit -m "chore(db): migrate ..."
git push

# На VPS — применяются автоматически через migrator при деплое.
# Или вручную:
docker compose run --rm migrator sh -c "npx prisma migrate deploy"
```

---

## Полезные команды

```bash
# Просмотр логов приложения
docker compose logs app --tail=100 -f

# Prisma Studio (UI для БД) — только локально
pnpm db:studio

# Ручной бэкап
docker compose exec app npx tsx -e "require('./lib/backup').createBackup()"
# ИЛИ через UI: /admin/backups → «Создать бэкап»

# Смотреть бэкапы
ls -la /opt/infoscan-docs/backups/

# Остановить всё
docker compose --profile full down

# Полный сброс (УДАЛИТ ВСЕ ДАННЫЕ):
docker compose --profile full down -v    # -v удаляет volumes!
```

---

## Стек

- **Next.js 15** (App Router, `output: 'standalone'`) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4** + `@tailwindcss/typography`
- **PostgreSQL 16** — основная БД
- **Prisma 5** — ORM + миграции
- **Auth.js v5** (`next-auth`) — аутентификация, роли ADMIN / EDITOR
- **MDX** — формат статей (хранится в поле `body` в PostgreSQL)
- **CodeMirror 6** — MDX-редактор в админке
- **@dnd-kit** — drag-and-drop
- **sonner** — toast-уведомления
- **cmdk** — Cmd+K command palette
- **sharp** — конвертация изображений в WebP
- **simple-git** — Git Sync
- **Vitest** + **Playwright** — тесты
- **Docker Compose** — оркестрация (5 сервисов)
- **pnpm** — пакет-менеджер (Node >= 20)

---

## Структура проекта

```
infoscan-docs/
├── app/
│   ├── (site)/                  # Route group: публичные страницы
│   │   ├── [section]/[slug]/    # Страница статьи из БД
│   │   ├── layout.tsx           # Публичный layout
│   │   └── ...
│   ├── admin/                   # Админ-панель
│   │   ├── login/               # Страница входа
│   │   ├── articles/            # CRUD статей + MDX-редактор
│   │   ├── sections/            # CRUD разделов
│   │   ├── reference/           # Модели/Прошивки/Переменные
│   │   ├── learning-paths/      # Учебные пути
│   │   ├── faq/                 # FAQ
│   │   ├── users/               # Управление пользователями
│   │   ├── audit/               # Аудит-лог
│   │   ├── git-sync/            # Git Sync
│   │   ├── backups/             # Бэкапы БД
│   │   └── layout.tsx           # Admin layout + sidebar
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Auth.js handlers
│   │   ├── health/              # GET /api/health (DB check)
│   │   ├── public/search/       # Публичный поиск
│   │   ├── public/rss.xml/      # RSS лента
│   │   ├── admin/upload/        # Загрузка изображений
│   │   ├── admin/preview/       # MDX → HTML превью
│   │   └── admin/backup/[file]/ # Скачать бэкап
│   └── layout.tsx               # Корневой layout
├── components/
│   ├── admin/                   # AdminShell, MdxEditor, MdxPreview, ...
│   ├── docs/                    # Callout, Steps, CodeTabs, Mermaid, ...
│   └── ui/                      # Button, Card, Badge, Input, ...
├── lib/
│   ├── prisma.ts                # Singleton PrismaClient
│   ├── content.ts               # Публичное API контента (с ISR)
│   ├── audit.ts                 # recordAudit()
│   ├── backup.ts                # pg_dump / pg_restore
│   ├── git-sync.ts              # Git Sync логика
│   ├── rate-limit.ts            # In-memory rate limiter
│   ├── env.ts                   # Zod env validation
│   └── utils.ts                 # cn, formatDate, ...
├── prisma/
│   ├── schema.prisma            # 16 моделей БД
│   ├── migrations/              # SQL-миграции (применяются migrator)
│   └── seed.ts                  # Seed: импорт MDX → PostgreSQL
├── features/
│   ├── builder/                 # Конструктор JS-шаблона (Zustand)
│   └── emulator/                # Эмулятор устройства
├── tests/
│   ├── unit/                    # Vitest (47 тестов)
│   └── e2e/                     # Playwright (smoke + admin)
├── scripts/
│   ├── build-search.ts          # Индекс поиска (postbuild)
│   └── backup-loop.sh           # Docker backup-контейнер (pg_dump)
├── secrets/                     # SSH deploy key (в .gitignore)
├── Dockerfile                   # Multi-stage: deps → builder → runner
├── docker-compose.yml           # 5 сервисов (--profile full)
├── nginx.conf                   # Reverse proxy → app:3000
├── auto-deploy.sh               # Cron-деплой на VPS
├── auth.ts                      # Auth.js v5 config
├── auth.config.ts               # Auth.js middleware config
├── middleware.ts                # Protect /admin/:path*
└── .env.example                 # Шаблон переменных окружения
```

---

## Доступы

**VPS**: `178.72.170.189`, Selectel, Ubuntu 24.04.

- SSH: `ssh -i ~/.ssh/id_ed25519_github root@178.72.170.189`
- Проект в: `/opt/infoscan-docs/`
- Лог деплоя: `/var/log/infoscan-deploy.log`

**GitHub**:

- Репо: `https://github.com/Probrokker/infoscan_tst`
- Email: `probrokker@gmail.com`

**Локальная разработка**:

```bash
# Поднять только Postgres:
docker compose up -d postgres

# Настроить .env.local:
DATABASE_URL=postgresql://infoscan:devpass@localhost:5432/infoscan
NEXTAUTH_SECRET=any-local-secret-here
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@inf-tec.ru
ADMIN_PASSWORD=localdev123

# Старт:
pnpm dev
```

---

## Безопасность (чеклист)

- [ ] Сменить root-пароль на VPS: `passwd`
- [ ] Убедиться что `NEXTAUTH_SECRET` в `.env` — уникальная строка 32+ символов
- [ ] `ADMIN_PASSWORD` в `.env` — надёжный пароль
- [ ] В `.env` нет дефолтных значений из `.env.example`
- [ ] Если использовался GitHub PAT ранее в открытом виде — отозвать в GitHub → Settings → Developer settings
- [ ] Порт 5432 закрыт снаружи (в `docker-compose.yml` Postgres слушает `127.0.0.1:5432`)

---

## Правила работы с пользователем

1. **Объясняй простыми словами.** Кирилл понимает архитектуру, Git, Docker, но **не пишет код**.
2. **Не запускай команды без подтверждения**, особенно деструктивные (`docker ... down -v`, `rm -rf`, `pg_restore`).
3. **Не вставляй секреты в код или git.** `.env` и `secrets/` — в `.gitignore`.
4. **Каждое изменение — отдельный коммит** по Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`.
5. **Тестируй локально перед пушем.** `pnpm build` → `pnpm test` → `git push`.
6. **Перед деструктивными операциями с БД** — сначала `pg_dump` через UI `/admin/backups`.

---

## Контакты

- **Кирилл Казарцев** — пользователь.
- Telegram: `@kazartsevk`
- Email: `probrokker@gmail.com` / `sales@inf-tec.ru`
