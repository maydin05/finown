#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_id=$(docker run --detach --rm --env POSTGRES_HOST_AUTH_METHOD=trust postgres:18)
trap 'docker stop "$container_id" >/dev/null' EXIT
for attempt in {1..60}; do
  if docker exec "$container_id" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 0.2
done
for file in tests/sql/package123-bootstrap.sql supabase/migrations/202611010001_loan_plans_and_debt_link.sql tests/sql/package123-assertions.sql; do
 docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 < "$file"
done
# Two simultaneous retries with the same idempotency key must create only one plan.
for attempt in 1 2; do
 docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 <<'SQL' >/dev/null &
begin;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select create_loan_with_payments(1,'Concurrent fixture',100,4,'2026-05-01','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
select pg_sleep(0.2);
commit;
SQL
 task_pids[$attempt]=$!
done
wait "${task_pids[1]}"
wait "${task_pids[2]}"
docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 <<'SQL'
do $$begin
 if (select count(*) from products where creation_request_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')<>1 then raise exception 'Concurrent duplicate product';end if;
 if (select count(*) from payments where product_id=(select id from products where creation_request_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'))<>4 then raise exception 'Concurrent duplicate payments';end if;
end $$;
SQL
for due_month in 5 6; do
 docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 -v due_month="$due_month" <<'SQL' >/dev/null &
begin;
set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
update payments set is_paid=true where product_id=(select id from products where creation_request_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee') and due_date=make_date(2026,:due_month,1);
select pg_sleep(0.2);
commit;
SQL
 task_pids[$due_month]=$!
done
wait "${task_pids[5]}"
wait "${task_pids[6]}"
docker exec -i "$container_id" psql -U postgres -X -v ON_ERROR_STOP=1 <<'SQL'
do $$begin
 if (select remaining from products where creation_request_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')<>200 then raise exception 'Concurrent remaining mismatch';end if;
end $$;
select 'PASS: concurrent retry and concurrent payment updates' as result;
SQL
