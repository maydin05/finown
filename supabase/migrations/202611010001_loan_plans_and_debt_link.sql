-- Additive change only: existing payment dates, amounts and statuses are untouched.
begin;
alter table public.expense_sources add column if not exists is_debt boolean not null default false;
alter table public.products add column if not exists creation_request_id uuid;
create unique index if not exists products_user_creation_request_unique on public.products(user_id,creation_request_id) where creation_request_id is not null;

create or replace function public.create_loan_with_payments(p_bank_id bigint,p_name text,p_installment_amount numeric,p_total_installments integer,p_first_payment_date date,p_request_id uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); loan public.products%rowtype; bank_name text; m date;
begin
 if owner_id is null then raise exception 'Oturum gerekli'; end if;
 if p_name is null or length(btrim(p_name))=0 or p_installment_amount is null or p_installment_amount<=0 or p_installment_amount<>round(p_installment_amount,2) or p_total_installments is null or p_total_installments<1 or p_total_installments>600 or p_first_payment_date is null or p_request_id is null then raise exception 'Kredi bilgileri geçersiz'; end if;
 select name into bank_name from public.banks where id=p_bank_id and user_id=owner_id;
 if not found then raise exception 'Banka bulunamadı'; end if;
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text||':'||p_request_id::text,0));
 select * into loan from public.products where user_id=owner_id and creation_request_id=p_request_id;
 if found then
   if loan.bank_id<>p_bank_id or loan.name<>btrim(p_name) or loan.installment_amount<>p_installment_amount or loan.total_installments<>p_total_installments or loan.first_payment_date<>p_first_payment_date then raise exception 'İstek kimliği farklı kredi için kullanılamaz'; end if;
 else
   insert into public.products(user_id,bank_id,type,name,total,remaining,installment_amount,total_installments,first_payment_date,creation_request_id)
   values(owner_id,p_bank_id,'loan',btrim(p_name),p_installment_amount*p_total_installments,p_installment_amount*p_total_installments,p_installment_amount,p_total_installments,p_first_payment_date,p_request_id) returning * into loan;
   for i in 0..p_total_installments-1 loop
     m:=(date_trunc('month',p_first_payment_date)+make_interval(months=>i))::date;
     insert into public.payments(user_id,product_id,title,subtitle,amount,due_date,type,is_paid,is_manual)
     values(owner_id,loan.id,bank_name||' '||loan.name,'Kredi Taksiti '||(i+1)||'/'||p_total_installments,p_installment_amount,
       m+(least(extract(day from p_first_payment_date)::int,extract(day from (m+interval '1 month - 1 day'))::int)-1),'loan',false,false);
   end loop;
 end if;
 select * into loan from public.products where id=loan.id and user_id=owner_id;
 return jsonb_build_object('product',to_jsonb(loan),'payments',(select coalesce(jsonb_agg(to_jsonb(x) order by x.due_date,x.id),'[]'::jsonb) from public.payments x where x.product_id=loan.id and x.user_id=owner_id));
end $$;
revoke all on function public.create_loan_with_payments(bigint,text,numeric,integer,date,uuid) from public,anon;
grant execute on function public.create_loan_with_payments(bigint,text,numeric,integer,date,uuid) to authenticated;

-- Serialize recalculations per product; no writes to payments or their statuses.
create or replace function public.refresh_loan_remaining() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare target_id bigint; owner_id uuid; target_ids bigint[];
begin
 if tg_op='DELETE' then owner_id:=old.user_id; target_ids:=array[old.product_id];
 elsif tg_op='INSERT' then owner_id:=new.user_id; target_ids:=array[new.product_id];
 else
   if new.user_id is distinct from old.user_id then raise exception 'Ödeme sahibi değiştirilemez'; end if;
   owner_id:=new.user_id; target_ids:=array[old.product_id,new.product_id];
 end if;
 for target_id in select distinct x from unnest(target_ids) x where x is not null order by x loop
   perform 1 from public.products where id=target_id and user_id=owner_id and type='loan' for update;
   if found then
     update public.products set remaining=(select coalesce(sum(amount) filter(where not coalesce(is_paid,false)),0) from public.payments where product_id=target_id and user_id=owner_id and type='loan') where id=target_id and user_id=owner_id and type='loan';
   end if;
 end loop;
 return null;
end $$;
revoke all on function public.refresh_loan_remaining() from public,anon;
drop trigger if exists payments_refresh_loan_remaining on public.payments;
create trigger payments_refresh_loan_remaining after insert or update or delete on public.payments for each row execute function public.refresh_loan_remaining();

-- Existing plans are immutable here: this only edits the product's descriptive fields.
create or replace function public.update_loan_details(p_id bigint,p_bank_id bigint,p_name text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare owner_id uuid:=auth.uid(); loan public.products%rowtype;
begin
 if owner_id is null then raise exception 'Oturum gerekli'; end if;
 if p_name is null or length(btrim(p_name))=0 then raise exception 'Kredi adı gerekli'; end if;
 perform 1 from public.banks where id=p_bank_id and user_id=owner_id;
 if not found then raise exception 'Banka bulunamadı'; end if;
 select * into loan from public.products where id=p_id and user_id=owner_id and type='loan' for update;
 if not found then raise exception 'Kredi bulunamadı'; end if;
 update public.products set bank_id=p_bank_id,name=btrim(p_name),remaining=case when exists(select 1 from public.payments where product_id=p_id and user_id=owner_id and type='loan') then (select coalesce(sum(amount) filter(where not coalesce(is_paid,false)),0) from public.payments where product_id=p_id and user_id=owner_id and type='loan') else remaining end where id=p_id and user_id=owner_id returning * into loan;
 return to_jsonb(loan);
end $$;
revoke all on function public.update_loan_details(bigint,bigint,text) from public,anon;
grant execute on function public.update_loan_details(bigint,bigint,text) to authenticated;
notify pgrst, 'reload schema';
commit;
