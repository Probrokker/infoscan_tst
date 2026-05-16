# Multi-stage Dockerfile: pnpm-сборка → nginx со статикой.

# 1. Сборка
FROM node:20-alpine AS builder
WORKDIR /app

# corepack для pnpm нужной версии из packageManager
RUN corepack enable

# Сначала lockfile — кэш для зависимостей
COPY package.json pnpm-lock.yaml* .npmrc* ./
# Если есть lockfile — frozen, если нет (первая сборка) — обычный install
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      pnpm install --no-frozen-lockfile; \
    fi

# Затем исходники
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL=http://178.72.170.189

# Сначала собираем Next, потом — индекс поиска (через тот же pnpm postbuild)
RUN pnpm build

# 2. Раздача статики через nginx
FROM nginx:1.27-alpine AS runner

# Конфиг nginx с security-заголовками и кешированием
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Собранная статика (out/) — корень сайта
COPY --from=builder /app/out /usr/share/nginx/html

# Пользователь nginx уже не root
EXPOSE 80

# Healthcheck — статичный 200 на корне
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
