#!/bin/sh
set -eu

release_tag="${1:-}"
case "${release_tag}" in
  ''|*[!0-9a-f]*)
    echo "Usage: $0 <git-commit-sha>" >&2
    exit 2
    ;;
esac
if [ "${#release_tag}" -lt 7 ] || [ "${#release_tag}" -gt 40 ]; then
  echo "Usage: $0 <git-commit-sha>" >&2
  exit 2
fi

docker_bin="${QNAP_DOCKER_BIN:-/share/CACHEDEV6_DATA/.qpkg/container-station/bin/docker}"
compose_file="deploy/qnap/docker-compose.full.yml"
bind_ip="${NK_CARS_BIND_IP:-192.168.0.132}"
host_port="${NK_CARS_HOST_PORT:-4332}"

export NK_CARS_RELEASE_TAG="${release_tag}"
export NK_CARS_BIND_IP="${bind_ip}"
export NK_CARS_HOST_PORT="${host_port}"

"${docker_bin}" compose -f "${compose_file}" config --quiet
"${docker_bin}" compose -f "${compose_file}" up -d nk-cars-postgres

for attempt in $(seq 1 30); do
  health="$("${docker_bin}" inspect tony-nk-cars-postgres --format '{{.State.Health.Status}}' 2>/dev/null || true)"
  [ "${health}" = "healthy" ] && break
  if [ "${health}" = "unhealthy" ]; then
    "${docker_bin}" logs --tail 100 tony-nk-cars-postgres >&2 || true
    exit 1
  fi
  sleep 2
done

if [ "$("${docker_bin}" inspect tony-nk-cars-postgres --format '{{.State.Health.Status}}' 2>/dev/null || true)" != "healthy" ]; then
  echo "PostgreSQL did not become healthy." >&2
  exit 1
fi

# Init scripts do not rerun for an existing PostgreSQL volume, so apply the
# idempotent sourcing migration explicitly before starting the new Data API.
"${docker_bin}" exec tony-nk-cars-postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/020_sourcing_automation.sql'

"${docker_bin}" compose -f "${compose_file}" build nk-cars-data nk-cars-app
"${docker_bin}" compose -f "${compose_file}" up -d

for attempt in $(seq 1 40); do
  app_health="$("${docker_bin}" inspect tony-nk-cars-full --format '{{.State.Health.Status}}' 2>/dev/null || true)"
  data_health="$("${docker_bin}" inspect tony-nk-cars-data --format '{{.State.Health.Status}}' 2>/dev/null || true)"
  if [ "${app_health}" = "healthy" ] && [ "${data_health}" = "healthy" ]; then
    curl --fail --silent --show-error --max-time 15 "http://${bind_ip}:${host_port}/buy" >/dev/null
    echo "NK Cars full release ${release_tag} is healthy at http://${bind_ip}:${host_port}/buy"
    exit 0
  fi
  if [ "${app_health}" = "unhealthy" ] || [ "${data_health}" = "unhealthy" ]; then
    "${docker_bin}" logs --tail 100 tony-nk-cars-data >&2 || true
    "${docker_bin}" logs --tail 100 tony-nk-cars-full >&2 || true
    exit 1
  fi
  sleep 5
done

"${docker_bin}" logs --tail 100 tony-nk-cars-data >&2 || true
"${docker_bin}" logs --tail 100 tony-nk-cars-full >&2 || true
echo "Timed out waiting for the NK Cars full stack." >&2
exit 1
