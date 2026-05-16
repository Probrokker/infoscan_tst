#!/usr/bin/env bash
# Авто-деплой: вызывается cron'ом каждые 2 минуты.
# Если в репозитории появились новые коммиты — pull + пересборка.
set -e
cd /opt/infoscan-docs
git fetch origin main -q
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "[$(date)] Обнаружены новые коммиты, обновляю..."
  git pull -q
  docker compose up -d --build
  echo "[$(date)] Готово."
fi
