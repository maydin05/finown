import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {startSupabaseAuthEnvironment} from '../../server/family/auth-environment.mjs';

test('optional statement-month migration: real local PostgreSQL, no backfill/history mutation, month/type constraints',async()=>{
 let env;
 try {
  env=await startSupabaseAuthEnvironment({fixtures:false});
  assert.equal(env.pool.options.host,'127.0.0.1');assert.equal((await env.pool.query("select name from family_local.guard where name='finown-family-local'")).rowCount,1);
  await env.pool.query(`create schema statement_boundary_test;
   create table statement_boundary_test.products(id bigint primary key,type text,name text);
   create table statement_boundary_test.payments(id bigint primary key,product_id bigint references statement_boundary_test.products(id),amount numeric(14,2),due_date date,is_paid boolean);
   insert into statement_boundary_test.products values(18,'card','Fixture card'),(19,'loan','Fixture loan');
   insert into statement_boundary_test.payments values(171,18,1000,'2026-11-16',true),(172,18,1001,'2026-12-16',false),(173,18,1002,'2027-01-16',false);`);
  const snapshot=async()=>(await env.pool.query('select jsonb_agg(to_jsonb(p) order by id) data from statement_boundary_test.payments p')).rows[0].data;
  const before=await snapshot();
  const sql=await readFile('supabase/migrations/202611030001_card_first_statement_month.sql','utf8');
  assert.equal(sql.split('public.products').length-1,3);
  // Execute the exact migration statements in a disposable sibling schema, never production.
  await env.pool.query(sql.replaceAll('public.products','statement_boundary_test.products'));
  assert.equal((await env.pool.query('select * from statement_boundary_test.products where first_statement_month is not null')).rowCount,0);assert.deepEqual(await snapshot(),before);
  await env.pool.query("update statement_boundary_test.products set first_statement_month='2026-11-01' where id=18");
  for(const [id,date] of [[18,'2026-11-16'],[18,'1899-01-01'],[19,'2026-11-01']])await assert.rejects(()=>env.pool.query('update statement_boundary_test.products set first_statement_month=$1 where id=$2',[date,id]),/products_first_statement_month_check/);
  assert.deepEqual(await snapshot(),before);
  await env.pool.query('update statement_boundary_test.products set first_statement_month=null where id=18');assert.deepEqual(await snapshot(),before);
 }finally{await env?.close();}
});
