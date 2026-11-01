insert into products(id,user_id,bank_id,type,name) values(1,'11111111-1111-4111-8111-111111111111',1,'loan','Protected fixture');
insert into payments(user_id,product_id,title,amount,due_date,is_paid) values('11111111-1111-4111-8111-111111111111',1,'Protected payment',123.45,'2026-11-05',true);
create temp table protected_before as select to_jsonb(p) as row from payments p;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select save_available_balance(2000,(now() at time zone 'Europe/Istanbul')::date,repeat('a',64));
do $$ begin
 begin perform save_available_balance(999,current_date,repeat('a',64),'22222222-2222-4222-8222-222222222222');raise exception 'Wrong expected owner accepted';exception when raise_exception then if sqlerrm='Wrong expected owner accepted' then raise;end if;end;
 if (select amount from available_balances)<>2000 then raise exception 'Balance mismatch';end if;
 if (select captured_at is null from available_balances) then raise exception 'Timestamp missing';end if;
 perform save_available_balance(0,(now() at time zone 'Europe/Istanbul')::date,repeat('b',64));
 if (select amount from available_balances)<>0 then raise exception 'Zero lost';end if;
 begin perform save_available_balance(-1,current_date,repeat('a',64));raise exception 'Negative accepted';exception when raise_exception then if sqlerrm='Negative accepted' then raise;end if;end;
 begin perform save_available_balance('NaN'::numeric,current_date,repeat('a',64));raise exception 'NaN accepted';exception when raise_exception then if sqlerrm='NaN accepted' then raise;end if;end;
 begin perform save_available_balance(1.001,current_date,repeat('a',64));raise exception 'Fraction accepted';exception when raise_exception then if sqlerrm='Fraction accepted' then raise;end if;end;
 begin perform save_available_balance(1,current_date+2,repeat('a',64));raise exception 'Future accepted';exception when raise_exception then if sqlerrm='Future accepted' then raise;end if;end;
 begin perform save_available_balance(1,current_date,null);raise exception 'Missing fingerprint accepted';exception when raise_exception then if sqlerrm='Missing fingerprint accepted' then raise;end if;end;
end $$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$ begin
 if exists(select 1 from available_balances) then raise exception 'Other owner visible';end if;
 update available_balances set amount=999 where user_id='11111111-1111-4111-8111-111111111111';
 if found then raise exception 'Other owner writable';end if;
 perform save_available_balance(500,current_date,repeat('c',64));
end $$;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select save_available_balance(null,null,null);
do $$ begin
 if not exists(select 1 from available_balances where amount is null and as_of_date is null and basis_fingerprint is null) then raise exception 'Clear failed';end if;
 if (select count(*) from available_balances)<>1 then raise exception 'Owner isolation failed';end if;
end $$;
reset role;
do $$ begin
 if exists((select to_jsonb(p) from payments p) except (select row from protected_before)) or exists((select row from protected_before) except (select to_jsonb(p) from payments p)) then raise exception 'Protected payments changed';end if;
 if has_table_privilege('anon','available_balances','select') or has_function_privilege('anon','save_available_balance(numeric,date,text,uuid)','execute') then raise exception 'Anon permission';end if;
 if has_table_privilege('authenticated','available_balances','delete') then raise exception 'Delete permission';end if;
 if (select prosecdef from pg_proc where oid='save_available_balance(numeric,date,text,uuid)'::regprocedure) then raise exception 'Unexpected definer';end if;
 if (select count(*) from available_balances)<>2 then raise exception 'Owner rows lost';end if;
end $$;
select 'PASS: separate balances, zero/clear/validation, RLS ownership, anon denial and protected payments' as result;
