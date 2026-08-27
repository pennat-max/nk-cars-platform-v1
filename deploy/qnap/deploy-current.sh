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
compose_file="deploy/qnap/docker-compose.current.yml"
bind_ip="${NK_CARS_BIND_IP:-192.168.0.132}"
host_port="${NK_CARS_HOST_PORT:-4331}"

export NK_CARS_RELEASE_TAG="${release_tag}"
export NK_CARS_BIND_IP="${bind_ip}"
export NK_CARS_HOST_PORT="${host_port}"

"${docker_bin}" compose -f "${compose_file}" config --quiet
"${docker_bin}" compose -f "${compose_file}" build
"${docker_bin}" compose -f "${compose_file}" up -d

for attempt in $(seq 1 30); do
  health="$("${docker_bin}" inspect tony-nk-cars-current --format '{{.State.Health.Status}}' 2>/dev/null || true)"
  if [ "${health}" = "healthy" ]; then
    curl --fail --silent --show-error --max-time 15 "http://${bind_ip}:${host_port}/buy" >/dev/null
    echo "NK Cars current release ${release_tag} is healthy at http://${bind_ip}:${host_port}/buy"
    exit 0
  fi
  if [ "${health}" = "unhealthy" ]; then
    "${docker_bin}" logs --tail 100 tony-nk-cars-current >&2 || true
    exit 1
  fi
  sleep 5
done

"${docker_bin}" logs --tail 100 tony-nk-cars-current >&2 || true
echo "Timed out waiting for tony-nk-cars-current to become healthy." >&2
exit 1
