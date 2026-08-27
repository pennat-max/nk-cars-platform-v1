#!/bin/sh
set -eu

if [ -z "${NK_CARS_APP_DB_PASSWORD:-}" ]; then
  echo "NK_CARS_APP_DB_PASSWORD is required" >&2
  exit 1
fi

psql --set=ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=app_password="$NK_CARS_APP_DB_PASSWORD" <<'SQL'
CREATE ROLE nk_cars_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
REVOKE ALL ON DATABASE nk_cars FROM PUBLIC;
GRANT CONNECT ON DATABASE nk_cars TO nk_cars_app;
SQL
