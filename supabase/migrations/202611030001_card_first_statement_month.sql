-- Optional first statement month. No backfill and no payment/history updates.
begin;
alter table public.products add column first_statement_month date;
alter table public.products add constraint products_first_statement_month_check check (
 first_statement_month is null or (
  type is not distinct from 'card'
  and first_statement_month between date '1900-01-01' and date '9999-12-01'
  and extract(day from first_statement_month)=1
 )
);
comment on column public.products.first_statement_month is
 'Optional first monthly statement period. Suppresses only earlier generated empty statements; stored payments are always retained.';
commit;
