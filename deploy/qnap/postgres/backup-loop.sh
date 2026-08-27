#!/bin/sh
set -eu

backup_dir=/backups/postgres
mkdir -p "$backup_dir"

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  target="$backup_dir/nk-cars-$timestamp.dump"
  pg_dump --format=custom --no-owner --no-privileges \
    --host="$PGHOST" --port="${PGPORT:-5432}" --username="$PGUSER" --dbname="$PGDATABASE" \
    --file="$target"
  (
    cd "$backup_dir"
    sha256sum "$(basename "$target")" > "$(basename "$target").sha256"
  )
  find "$backup_dir" -type f -name 'nk-cars-*.dump*' -mtime "+${NK_BACKUP_RETENTION_DAYS:-30}" -delete
  sleep "${NK_BACKUP_INTERVAL_SECONDS:-86400}"
done
