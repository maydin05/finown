import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {AuthClient} from '@supabase/supabase-js';
import {startSupabaseAuthEnvironment} from '../../server/family/auth-environment.mjs';
import {familyHttpServer} from '../../server/family/http.mjs';
import {balanceBasis,hashBalanceBasis,balanceFunding} from '../../src/domain/availableBalance.js';
test('main pages: genuine two-account authorization, scope refresh, opaque balance, immutable finance and membership removal',async()=>{
 let env,server;
 try {
  env=await startSupabaseAuthEnvironment({today:()=> '2026-11-01'});
  server=familyHttpServer(env.pool,{today:()=> '2026-11-01',authUrl:env.authUrl,anonKey:env.anonKey}).server;
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/family-api`;
  async function login(email){const auth=new AuthClient({url:env.authUrl,headers:{apikey:env.anonKey},persistSession:false,autoRefreshToken:false});const r=await auth.signInWithPassword({email,password:'Local-Test-Password-2026'});assert.equal(r.error,null);return {id:r.data.user.id,token:r.data.session.access_token};}
  const owner=await login('owner@family.test'),member=await login('member@family.test'),other=await login('other@family.test');
  async function api(who,path,body){const r=await fetch(url+path,{method:body===undefined?'GET':'POST',headers:{...(who?{Authorization:`Bearer ${who.token}`} : {}),'Content-Type':'application/json','X-Finown-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
  async function snapshot(){const data={};for(const t of ['banks','products','payments','income_sources','expense_sources','subscription_sources','subscription_payments','income_receipts','trackers','available_balances'])data[t]=(await env.pool.query(`select jsonb_agg(to_jsonb(r) order by id) v from ${t} r`)).rows[0].v;return data;}
  const before=await snapshot(),id=(await api(owner,'/budgets',{})).data.id;
  const invite=await api(owner,`/budgets/${id}/invite`,{email:'member@family.test'});assert.equal((await api(member,'/accept',{token:invite.data.token})).status,200);
  const path=`/budgets/${id}/main-view`;
  assert.equal((await api(null,path)).status,401);assert.equal((await api(other,path)).status,403);assert.equal((await api(member,path,{amount:999})).status,405);
  assert.deepEqual((await api(member,path)).data.payments,[]);
  async function scope(keys){const s=(await api(owner,`/budgets/${id}`)).data;assert.equal((await api(owner,`/budgets/${id}/command`,{operationId:randomUUID(),command:{action:'scope',payload:{keys},version:s.version},environmentVersion:s._server.environmentVersion})).status,200);}
  let state=(await api(owner,`/budgets/${id}`)).data;
  await scope([...state._server.records.map(r=>r.key),'balance']);
  const a=await api(member,path),b=await api(owner,path);assert.equal(a.status,200);assert.equal(a.data.readOnly,true);assert.equal(a.data.products.find(p=>p.id===10).firstStatementMonth,'2026-11-01');
  assert.deepEqual(a.data.payments,b.data.payments);assert.equal(a.data.payments.find(p=>p.id===990).dueDate,'2024-01-04');assert.equal(a.data.payments.find(p=>p.id===990).isPaid,true);
  assert.equal(a.data.incomeReceipts[0].actualAmount,23000);assert.equal(a.data.userId,member.id);assert.ok(!JSON.stringify(a.data).includes(owner.id));
  assert.equal(balanceFunding({amount:0},a.data.availableBalance,a.data.sharedFingerprint,'2026-11-01').fresh,true);
  assert.notEqual(a.data.sharedFingerprint,await hashBalanceBasis(balanceBasis(a.data)));
  const {rows}=await env.pool.query('select data from available_balances where user_id=$1',[owner.id]);assert.notEqual(a.data.sharedFingerprint,rows[0].data.basisFingerprint);
  const events=(await env.pool.query('select count(*)::int n from family_events')).rows[0].n;
  await api(member,path);assert.equal((await env.pool.query('select count(*)::int n from family_events')).rows[0].n,events);assert.deepEqual(await snapshot(),before);
  await scope(['payments:990']);const reduced=(await api(member,path)).data;assert.equal(reduced.payments.length,1);assert.deepEqual(reduced.incomeSources,[]);assert.equal(reduced.availableBalance,null);assert.notEqual(a.data.sharedRevision,reduced.sharedRevision);
  await api(owner,`/budgets/${id}/remove-member`,{});assert.equal((await api(member,path)).status,403);assert.deepEqual(await snapshot(),before);
 }finally{if(server)await new Promise(r=>server.close(r));await env?.close();}
});
