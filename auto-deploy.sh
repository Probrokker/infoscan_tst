#!/usr/bin/env bash
# Автодеплой на VPS: git fetch + при необходимости pull, затем docker compose.
#
# Важно: даже если коммит уже подтянут, всегда вызываем «docker compose up -d --build»,
# чтобы после сбоя билда следующий запуск восстановил контейнер (раньше при set -e
# после успешного pull и падения docker следующий тик видел «уже актуальный» git и
# не пересобирал образ).
#
# Cron (пример, с логом):
#   */2 * * * * /opt/infoscan-docs/auto-deploy.sh >> /var/log/infoscan-deploy.log 2>&1
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

# Защита от параллельных запусков (cron-тик + ручной прогон).
# Если другой инстанс уже работает — выходим без ошибки, чтобы cron не плодил алерты.
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

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] docker compose up -d --build"
docker compose up -d --build

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] deploy: OK"
