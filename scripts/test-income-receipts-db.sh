#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_id=$(docker run --detach --rm --env POSTGRES_HOST_AUTH_METHOD=trust postgres:18)
trap 'docker stop "$container_id" >/dev/null' EXIT
for attempt in {1..60}; do
 if docker exec "$container_id" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
 sleep 0.2
done
for file in tests/sql/package123-bootstrap.sql tests/sql/income-receipts-bootstrap.sql supabase/migrations/202611010003_income_receipts.sql tests/sql/income-receipts-assertions.sql; do
 docker exec -i "$container_id" psql -h 127.0.0.1 -U postgres -X -v ON_ERROR_STOP=1 < "$file"
done
