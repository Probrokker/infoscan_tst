#!/bin/sh
# backup-loop.sh — фоновый pg_dump раз в сутки в volume /backups.
# Работает в отдельном контейнере (image: postgres:16-alpine).
# Retention управляется переменной BACKUP_RETENTION_DAYS (по умолчанию 14).

set -eu

RETENTION="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p /backups

while true; do
  TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  FILE="/backups/db-${TS}.dump"
  echo "[$(date -Iseconds)] backup: ${FILE}"
  PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=custom \
    --compress=9 \
    -f "$FILE"
  echo "[$(date -Iseconds)] backup: done, размер $(du -h "$FILE" | cut -f1)"

  echo "[$(date -Iseconds)] cleanup: удаляю бэкапы старше ${RETENTION} дней"
  find /backups -name 'db-*.dump' -type f -mtime "+${RETENTION}" -print -delete || true

  sleep 86400
done
