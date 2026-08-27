#!/bin/sh
set -eu

dump_file="${1:?Usage: restore-test.sh /backups/postgres/nk-cars-TIMESTAMP.dump}"
test_db="nk_cars_restore_test_$(date -u +%Y%m%d%H%M%S)"

cleanup() {
  psql --host="$PGHOST" --username="$PGUSER" --dbname=postgres --set=ON_ERROR_STOP=1 \
    --command="DROP DATABASE IF EXISTS $test_db WITH (FORCE);" >/dev/null
}
trap cleanup EXIT

psql --host="$PGHOST" --username="$PGUSER" --dbname=postgres --set=ON_ERROR_STOP=1 \
  --command="CREATE DATABASE $test_db;" >/dev/null
pg_restore --host="$PGHOST" --username="$PGUSER" --dbname="$test_db" --no-owner --no-privileges "$dump_file"
psql --host="$PGHOST" --username="$PGUSER" --dbname="$test_db" --tuples-only --no-align \
  --command="SELECT json_build_object('workspaces', (SELECT count(*) FROM buying_browser_workspaces), 'vehicles', (SELECT count(*) FROM inventory_vehicles), 'media', (SELECT count(*) FROM vehicle_media));"
