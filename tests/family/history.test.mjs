import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {AuthClient} from '@supabase/supabase-js';
import {startSupabaseAuthEnvironment} from '../../server/family/auth-environment.mjs';
import {familyHttpServer} from '../../server/family/http.mjs';
let env,server,url,owner,member,other,id,snapshot;
async function api(who,path,body){const r=await fetch(url+'/family-api'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${who.token}`,'Content-Type':'application/json','X-Finown-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function login(email){const c=new AuthClient({url:env.authUrl,headers:{apikey:env.anonKey},persistSession:false,autoRefreshToken:false});const r=await c.signInWithPassword({email,password:'Local-Test-Password-2026'});assert.equal(r.error,null);return {id:r.data.user.id,token:r.data.session.access_token};}
async function finance(){const s={};for(const t of ['banks','products','payments','income_sources','expense_sources','subscription_sources','subscription_payments','income_receipts','trackers','available_balances'])s[t]=(await env.pool.query(`select jsonb_agg(to_jsonb(r) order by id) v from ${t} r`)).rows[0].v;return s;}
before(async()=>{
 env=await startSupabaseAuthEnvironment();server=familyHttpServer(env.pool,{authUrl:env.authUrl,anonKey:env.anonKey}).server;await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}`;
 owner=await login('owner@family.test');member=await login('member@family.test');other=await login('other@family.test');
 id=(await api(owner,'/budgets',{})).data.id;
 const inv=await api(owner,`/budgets/${id}/invite`,{email:'member@family.test'});assert.equal((await api(member,'/accept',{token:inv.data.token})).status,200);
 snapshot=await finance();
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await env?.close();});
test('history respects shared scope and genuine membership, preserves old received amounts and paid records',async()=>{
 assert.deepEqual((await api(member,`/budgets/${id}/history`)).data.rows,[]);
 let state=(await api(owner,`/budgets/${id}`)).data;
 const scope=['payments:990','incomeSources:102'];
 assert.equal((await api(owner,`/budgets/${id}/command`,{operationId:randomUUID(),command:{action:'scope',payload:{keys:scope},version:state.version},environmentVersion:state._server.environmentVersion})).status,200);
 const count=(await env.pool.query('select count(*)::int n from family_events')).rows[0].n;
 const history=await api(member,`/budgets/${id}/history`);assert.equal(history.status,200);assert.equal(history.data.rows.length,2);
 assert.equal(history.data.rows.find(r=>r.kind==='income').amount,23000);assert.equal(history.data.rows.find(r=>r.kind==='payment').status,'paid');
 assert.ok(!JSON.stringify(history).includes('Yerel Sanal Kart'));assert.ok(!JSON.stringify(history).includes('Yerel zorunlu ödeme'));assert.ok(!JSON.stringify(history).includes(owner.id));
 assert.equal((await api(other,`/budgets/${id}/history`)).status,403);
 assert.equal((await api(member,`/budgets/${id}/history`,{amount:999})).status,405);
 assert.equal((await api(member,`/budgets/${id}/history?period=2024-01`)).data.rows.length,2);
 assert.equal((await api(member,`/budgets/${id}/history?period=broken`)).status,400);
 assert.deepEqual(await finance(),snapshot);assert.equal((await env.pool.query('select count(*)::int n from family_events')).rows[0].n,count);
 await api(owner,`/budgets/${id}/remove-member`,{});assert.equal((await api(member,`/budgets/${id}/history`)).status,403);assert.deepEqual(await finance(),snapshot);
});
