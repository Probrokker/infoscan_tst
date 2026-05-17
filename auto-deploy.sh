#!/usr/bin/env bash
# Автодеплой на VPS: git fetch + при необходимости pull, затем docker compose.
#
# Для нового стека (standalone + Postgres) запускаем --profile full,
# чтобы поднять все сервисы: postgres, migrator, app, nginx, backup.
#
# Cron (пример, с логом):
#   */5 * * * * /opt/infoscan-docs/auto-deploy.sh >> /var/log/infoscan-deploy.log 2>&1
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# Защита от параллельных запусков (cron-тик + ручной прогон).
LOCK_FILE="/run/lock/infoscan-deploy.lock"
exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] skip: уже запущен другой инстанс (${LOCK_FILE})"
  exit 0
fi

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] deploy: repo=${REPO_ROOT}"

git fetch origin

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REMOTE_REF="origin/${CURRENT_BRANCH}"

if git rev-parse --verify "${REMOTE_REF}" >/dev/null 2>&1; then
  LOCAL="$(git rev-parse HEAD)"
  REMOTE="$(git rev-parse "${REMOTE_REF}")"
  if [[ "${LOCAL}" != "${REMOTE}" ]]; then
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] git: ${LOCAL:0:7} -> ${REMOTE:0:7} (pull)"
    git pull --ff-only
  else
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] git: уже ${LOCAL:0:7} (${CURRENT_BRANCH})"
  fi
else
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] WARN: нет ${REMOTE_REF}, выполняю git pull"
  git pull --ff-only
fi

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] docker compose --profile full up -d --build"
docker compose --profile full up -d --build

# Smoke-check: ждём /api/health до 60 сек
echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] smoke: ожидаю /api/health..."
for i in $(seq 1 12); do
  STATUS="$(curl -sf -o /dev/null -w '%{http_code}' http://localhost:80/api/health 2>/dev/null || echo 000)"
  if [[ "${STATUS}" == "200" ]]; then
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] smoke: OK (HTTP ${STATUS})"
    break
  fi
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] smoke: HTTP ${STATUS} — жду 5с (попытка ${i}/12)"
  sleep 5
done

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] deploy: OK"
