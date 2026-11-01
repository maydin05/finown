#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_id=$(docker run --detach --rm --env POSTGRES_HOST_AUTH_METHOD=trust postgres:18)
trap 'docker stop "$container_id" >/dev/null' EXIT
for attempt in {1..60}; do
 if docker exec "$container_id" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 sleep 0.2
done
for file in tests/sql/package123-bootstrap.sql supabase/migrations/202611010002_available_balance.sql tests/sql/available-balance-assertions.sql; do
 docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 < "$file"
done
