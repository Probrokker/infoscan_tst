# Multi-stage Dockerfile для Next.js 15 в режиме output: 'standalone'.
#
# Этапы:
#   1. deps     — ставит зависимости (pnpm) и кеширует node_modules.
#   2. builder  — собирает Next standalone (server.js + .next/standalone + .next/static).
#   3. runner   — минимальный образ только с тем, что нужно в проде (node + server.js).
#
# nginx больше не отдаёт статику — он стал reverse-proxy к app:3000 (см. nginx.conf
# и docker-compose.yml). Контейнер migrator выполняет prisma migrate deploy перед
# запуском app.

# 1. Зависимости
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# Копируем schema.prisma до pnpm install чтобы postinstall → prisma generate
# смог создать node_modules/.prisma с реальными (не симлинк) файлами
COPY package.json pnpm-lock.yaml* .npmrc* ./
COPY prisma ./prisma
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install --no-frozen-lockfile; \
    fi

# 2. Сборка
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Явная генерация Prisma client с целевой платформой
RUN ./node_modules/.bin/prisma generate

RUN pnpm build

# 3. Migrator: образ для prisma migrate deploy + opional seed
# Содержит полный исходный код (нужен для tsx prisma/seed.ts).
FROM node:20-alpine AS migrator
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
# Копируем весь исходный код (нужен для seed: импортирует lib/constants, lib/env и т.д.)
COPY . .
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# 4. Финальный рантайм
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl tini
RUN corepack enable

# Непривилегированный пользователь
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output содержит все необходимые зависимости включая Prisma client.
# Отдельное копирование node_modules/.prisma не требуется.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Каталоги под загрузки и бэкапы (volume в compose).
RUN mkdir -p /app/public/uploads /app/backups \
 && chown -R nextjs:nodejs /app/public/uploads /app/backups

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
