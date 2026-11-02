-- Prepared locally only. No change to existing finance policies or records.
begin;
do $$ begin if not exists(select 1 from pg_roles where rolname='family_server') then create role family_server nologin; end if; end $$;
create table public.family_budgets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id),
 state jsonb not null, created_at timestamptz not null default now(),
 check(jsonb_typeof(state)='object'),
 check((state->>'owner') is not distinct from owner_id::text and (state->>'id') is not distinct from id::text)
);
create table public.family_members (
 budget_id uuid not null references public.family_budgets on delete cascade,
 user_id uuid not null references auth.users(id), role text not null check(role in ('owner','requester')),
 primary key(budget_id,user_id), unique(budget_id,role)
);
create function public.family_membership_consistent() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.family_budgets%rowtype; v_id uuid;
begin
 if tg_table_name='family_budgets' then v_id:=new.id;
 else if tg_op='DELETE' then v_id:=old.budget_id; else v_id:=new.budget_id; end if; end if;
 select * into b from family_budgets where id=v_id;
 if not found then return null; end if;
 if (select count(*) from family_members where budget_id=v_id and role='owner' and user_id=b.owner_id)<>1
 or (select count(*) from family_members where budget_id=v_id and role='requester')<>(case when b.state->>'requester' is null then 0 else 1 end)
 or exists(select 1 from family_members where budget_id=v_id and role='requester' and user_id::text is distinct from b.state->>'requester')
 then raise exception 'Family membership/state mismatch'; end if;
 return null;
end $$;
create constraint trigger family_budget_membership after insert or update on family_budgets deferrable initially deferred for each row execute function family_membership_consistent();
create constraint trigger family_member_membership after insert or update or delete on family_members deferrable initially deferred for each row execute function family_membership_consistent();
create table public.family_invitations (
 id uuid primary key default gen_random_uuid(), budget_id uuid not null references public.family_budgets,
 email text not null, token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null, revoked_at timestamptz, accepted_at timestamptz,
 accepted_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.family_events (
 id uuid primary key, budget_id uuid not null references public.family_budgets,
 actor_id uuid not null references auth.users(id), event jsonb not null,
 created_at timestamptz not null default now()
);
create table public.family_operations (
 budget_id uuid not null references public.family_budgets, id uuid not null,
 actor_id uuid not null references auth.users(id), body_hash text not null,
 primary key(budget_id,id)
);
create function public.family_member(p_budget uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.family_members where budget_id=p_budget and user_id=auth.uid())
$$;
revoke all on function public.family_member(uuid) from public,anon;
grant execute on function public.family_member(uuid) to authenticated,family_server;
create function public.family_immutable_event() returns trigger language plpgsql set search_path=public,pg_temp as $$
 begin raise exception 'Family history is append-only'; end
$$;
create trigger family_event_immutable before update or delete on public.family_events for each row execute function public.family_immutable_event();
alter table public.family_budgets enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invitations enable row level security;
alter table public.family_events enable row level security;
alter table public.family_operations enable row level security;
create policy family_budget_read on public.family_budgets for select to authenticated using(public.family_member(id));
create policy family_members_read on public.family_members for select to authenticated using(public.family_member(budget_id));
create policy family_events_read on public.family_events for select to authenticated using(public.family_member(budget_id));
create policy family_budgets_service on public.family_budgets for all to family_server using(true) with check(true);
create policy family_members_service on public.family_members for all to family_server using(true) with check(true);
create policy family_invites_service on public.family_invitations for all to family_server using(true) with check(true);
create policy family_events_service on public.family_events for select to family_server using(true);
create policy family_events_append on public.family_events for insert to family_server with check(true);
create policy family_operations_service on public.family_operations for all to family_server using(true) with check(true);
revoke all on public.family_budgets,public.family_members,public.family_invitations,public.family_events,public.family_operations from public,anon,authenticated;
-- Do not expose state JSON (including private per-person notifications) to direct client queries.
grant select(id,owner_id,created_at) on public.family_budgets to authenticated;
grant select on public.family_members,public.family_events to authenticated;
grant usage on schema public,auth to family_server;
grant execute on function auth.uid() to family_server;
grant select,insert,update on public.family_budgets to family_server;
grant select,insert,delete on public.family_members to family_server;
grant select,insert,update on public.family_invitations to family_server;
grant select,insert on public.family_events,public.family_operations to family_server;
-- Only the trusted backend may read an owner's complete namespace to resolve legacy ID
-- collisions and calculate a private freshness hash. HTTP responses expose selected rows only.
create function public.family_private_finance(p_budget uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid; result jsonb := '{}'::jsonb; v_table text; records jsonb;
begin
 if not public.family_member(p_budget) then raise exception 'Not a family member'; end if;
 lock table public.banks,public.products,public.payments,public.income_sources,public.expense_sources,public.subscription_sources,public.subscription_payments,public.income_receipts,public.trackers,public.available_balances in share mode;
 select owner_id into v_owner from public.family_budgets where id=p_budget;
 foreach v_table in array array['banks','products','payments','income_sources','expense_sources','subscription_sources','subscription_payments','income_receipts','trackers','available_balances'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where user_id=$1',v_table) into records using v_owner;
  result := result || jsonb_build_object(v_table,records);
 end loop;
 return result;
end $$;
revoke all on function public.family_private_finance(uuid) from public,anon,authenticated;
grant execute on function public.family_private_finance(uuid) to family_server;
commit;
