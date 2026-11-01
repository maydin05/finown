create temp table protected_before as select 'sources' as name,to_jsonb(s) as row from income_sources s union all select 'payments',to_jsonb(p) from payments p union all select 'trackers',to_jsonb(t) from trackers t;
set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
select save_income_receipt(1,2026,11,'2026-11-05',120000,115000,true,'Deduction',auth.uid());
select save_income_receipt(1,2026,12,'2026-12-05',120000,140000,true,'Overtime',auth.uid());
do $$begin
 if (select count(*) from income_receipts)<>2 then raise exception 'Missing monthly rows';end if;
 perform save_income_receipt(1,2026,11,'2026-11-09',999,116000,true,'Correction',auth.uid());
 if not exists(select 1 from income_receipts where period_month=11 and actual_amount=116000 and expected_amount=120000 and due_date='2026-11-05') then raise exception 'Snapshot or upsert wrong';end if;
 if not exists(select 1 from income_receipts where period_month=12 and actual_amount=140000) then raise exception 'Other month changed';end if;
 perform save_income_receipt(1,2026,11,'2026-11-05',120000,0,false,'Undo',auth.uid());
 if not exists(select 1 from income_receipts where period_month=11 and not is_received and actual_amount=0) then raise exception 'Undo or zero failed';end if;
 begin perform save_income_receipt(1,2026,11,'2026-11-05',120000,-1,true,'',auth.uid());raise exception 'Negative accepted';exception when raise_exception then if sqlerrm='Negative accepted' then raise;end if;end;
 begin perform save_income_receipt(1,2026,11,'2026-11-05',120000,1.001,true,'',auth.uid());raise exception 'Fraction accepted';exception when raise_exception then if sqlerrm='Fraction accepted' then raise;end if;end;
 begin perform save_income_receipt(1,2026,11,'2026-11-05',120000,'NaN'::numeric,true,'',auth.uid());raise exception 'NaN accepted';exception when raise_exception then if sqlerrm='NaN accepted' then raise;end if;end;
 begin perform save_income_receipt(1,2026,11,'2026-12-05',120000,1,true,'',auth.uid());raise exception 'Wrong date accepted';exception when check_violation then null;end;
 begin perform save_income_receipt(1,2026,11,'2026-11-05',120000,1,true,'','22222222-2222-4222-8222-222222222222');raise exception 'Wrong session accepted';exception when raise_exception then if sqlerrm='Wrong session accepted' then raise;end if;end;
 begin perform save_income_receipt(2,2026,11,'2026-11-05',90000,1,true,'',auth.uid());raise exception 'Other source accepted';exception when raise_exception then if sqlerrm='Other source accepted' then raise;end if;end;
end $$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$begin
 if exists(select 1 from income_receipts) then raise exception 'Other owner visible';end if;
 update income_receipts set actual_amount=1 where income_id=1;if found then raise exception 'Other owner writable';end if;
 begin insert into income_receipts(user_id,income_id,period_year,period_month,due_date,expected_amount,actual_amount,is_received) values(auth.uid(),1,2026,11,'2026-11-05',120000,1,true);raise exception 'Foreign source insert accepted';exception when insufficient_privilege then null;end;
 perform save_income_receipt(2,2026,11,'2026-11-05',90000,85000,true,'',auth.uid());
end $$;
reset role;
do $$begin
 if exists((select 'sources',to_jsonb(s) from income_sources s union all select 'payments',to_jsonb(p) from payments p union all select 'trackers',to_jsonb(t) from trackers t) except select name,row from protected_before) then raise exception 'Existing financial rows changed';end if;
 if (select count(*) from protected_before)<>(select count(*) from income_sources)+(select count(*) from payments)+(select count(*) from trackers) then raise exception 'Protected row count changed';end if;
 if has_table_privilege('anon','income_receipts','select') or has_table_privilege('authenticated','income_receipts','delete') or has_function_privilege('anon','save_income_receipt(bigint,integer,integer,date,numeric,numeric,boolean,text,uuid)','execute') then raise exception 'Unexpected grants';end if;
 if (select prosecdef from pg_proc where oid='save_income_receipt(bigint,integer,integer,date,numeric,numeric,boolean,text,uuid)'::regprocedure) then raise exception 'Unexpected security definer';end if;
end $$;
select 'PASS: month isolation, actual correction, original plan/dates/payments/trackers preserved, RLS and RPC validation' as result;
