-- Separate manual snapshot. No writes to payment, tracker or source tables.
begin;
create table public.available_balances (
 user_id uuid primary key references auth.users(id) on delete cascade,
 amount numeric(14,2),
 as_of_date date,
 basis_fingerprint text,
 captured_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint available_balance_valid check (
  (amount is null and as_of_date is null and basis_fingerprint is null) or
  (amount is not null and amount>=0 and amount<1000000000000 and as_of_date is not null and basis_fingerprint is not null and basis_fingerprint ~ '^[a-f0-9]{64}$')
 )
);
alter table public.available_balances enable row level security;
revoke all on public.available_balances from public,anon,authenticated;
grant select,insert,update on public.available_balances to authenticated;
create policy available_balance_own on public.available_balances for all to authenticated
 using(user_id=auth.uid()) with check(user_id=auth.uid());
create function public.save_available_balance(p_amount numeric,p_as_of_date date,p_basis_fingerprint text,p_expected_user_id uuid default auth.uid())
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); result public.available_balances%rowtype;
begin
 if owner_id is null then raise exception 'Oturum gerekli'; end if;
 if p_expected_user_id is null or owner_id<>p_expected_user_id then raise exception 'Oturum değişti'; end if;
 if p_amount is null then
  if p_as_of_date is not null or p_basis_fingerprint is not null then raise exception 'Boş bakiye alanları geçersiz'; end if;
 else
  if p_amount<0 or p_amount>=1000000000000 or p_amount<>round(p_amount,2) or p_as_of_date is null or p_as_of_date>(now() at time zone 'Europe/Istanbul')::date or p_basis_fingerprint is null or p_basis_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Bakiye bilgileri geçersiz'; end if;
 end if;
 insert into public.available_balances(user_id,amount,as_of_date,basis_fingerprint,captured_at)
 values(owner_id,p_amount,p_as_of_date,p_basis_fingerprint,clock_timestamp())
 on conflict(user_id) do update set amount=excluded.amount,as_of_date=excluded.as_of_date,basis_fingerprint=excluded.basis_fingerprint,captured_at=excluded.captured_at
 returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.save_available_balance(numeric,date,text,uuid) from public,anon;
grant execute on function public.save_available_balance(numeric,date,text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
