set role authenticated;
set request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
do $$
declare result jsonb; loan_id bigint; old_rows jsonb; new_rows jsonb; remaining_amount numeric; n int;
begin
 result:=public.create_loan_with_payments(1,'Fixture loan',100,3,'2026-01-31','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 loan_id:=(result->'product'->>'id')::bigint;
 if jsonb_array_length(result->'payments')<>3 then raise exception 'Wrong count'; end if;
 if result->'payments'->0->>'due_date'<>'2026-01-31' or result->'payments'->1->>'due_date'<>'2026-02-28' or result->'payments'->2->>'due_date'<>'2026-03-31' then raise exception 'Month end drift'; end if;
 if exists(select 1 from payments where product_id=loan_id and is_paid) then raise exception 'Guessed paid status'; end if;
 perform public.create_loan_with_payments(1,'Fixture loan',100,3,'2026-01-31','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 select count(*) into n from products where creation_request_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; if n<>1 then raise exception 'Idempotency failed'; end if;
 select count(*) into n from payments where product_id=loan_id; if n<>3 then raise exception 'Duplicate plan'; end if;
 begin perform public.create_loan_with_payments(1,'Different request',100,3,'2026-01-31','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Expected payload rejection';exception when raise_exception then if sqlerrm='Expected payload rejection' then raise;end if;end;
 update payments set is_paid=true where product_id=loan_id and due_date='2026-02-28';
 select remaining into remaining_amount from products where id=loan_id;if remaining_amount<>200 then raise exception 'Remaining not reduced';end if;
 update payments set is_paid=false where product_id=loan_id and due_date='2026-02-28';
 select remaining into remaining_amount from products where id=loan_id;if remaining_amount<>300 then raise exception 'Undo not reflected';end if;
 -- Preserve existing per-payment dates even if they differ from the nominal first day.
 update payments set due_date='2026-02-27' where product_id=loan_id and due_date='2026-02-28';
 select jsonb_agg(to_jsonb(p) order by id) into old_rows from payments p where product_id=loan_id;
 perform public.update_loan_details(loan_id,1,'Renamed only');
 select jsonb_agg(to_jsonb(p) order by id) into new_rows from payments p where product_id=loan_id;
 if old_rows<>new_rows then raise exception 'Metadata edit changed schedule';end if;
 begin perform public.create_loan_with_payments(2,'Forbidden bank',100,3,'2026-01-31','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');raise exception 'Expected cross-user rejection';exception when raise_exception then if sqlerrm='Expected cross-user rejection' then raise;end if;end;
 begin perform public.create_loan_with_payments(1,'Invalid amount',-1,3,'2026-01-31','cccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'Expected validation failure';exception when raise_exception then if sqlerrm='Expected validation failure' then raise;end if;end;
 -- Ensure a failed installment insert rolls back the new product and earlier installments.
end $$;
reset role;
create function fail_second_fixture_payment() returns trigger language plpgsql as $$begin if new.title like '%Atomic failure%' and new.subtitle='Kredi Taksiti 2/3' then raise exception 'Fixture insert failure';end if;return new;end$$;
create trigger fixture_failure before insert on payments for each row execute function fail_second_fixture_payment();
set role authenticated;
do $$begin
 begin perform create_loan_with_payments(1,'Atomic failure',100,3,'2026-01-31','dddddddd-dddd-4ddd-8ddd-dddddddddddd');raise exception 'Expected atomic failure';exception when raise_exception then if sqlerrm='Expected atomic failure' then raise;end if;end;
 if exists(select 1 from products where creation_request_id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') or exists(select 1 from payments where title like '%Atomic failure%') then raise exception 'Partial plan remained';end if;
end$$;
set request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
do $$begin
 if exists(select 1 from products where creation_request_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'RLS exposed other owner';end if;
 begin perform update_loan_details((select min(id) from products),2,'Forbidden');raise exception 'Expected missing loan rejection';exception when raise_exception then if sqlerrm='Expected missing loan rejection' then raise;end if;end;
end$$;
reset role;
select 'PASS: atomic creation, month end, pending status, idempotency, remaining/undo, immutable existing rows, RLS and rollback' as result;
