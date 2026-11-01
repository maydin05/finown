create table income_sources(id bigint primary key,user_id uuid not null references auth.users,title text,amount numeric,start_date date,day_of_month integer);
alter table income_sources enable row level security;
create policy income_own on income_sources for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select on income_sources to authenticated;
insert into income_sources values(1,'11111111-1111-4111-8111-111111111111','Salary',120000,'2026-01-05',5),(2,'22222222-2222-4222-8222-222222222222','Other',90000,'2026-01-05',5);
create table trackers(user_id uuid,key text,value boolean);
insert into trackers values('11111111-1111-4111-8111-111111111111','income:1:2026:10',true);
insert into products(id,user_id,bank_id,type,name) values(1,'11111111-1111-4111-8111-111111111111',1,'loan','Protected');
insert into payments(user_id,product_id,title,amount,due_date,is_paid) values('11111111-1111-4111-8111-111111111111',1,'Protected',500,'2026-11-05',true);
