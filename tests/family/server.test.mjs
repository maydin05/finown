import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {AuthClient} from '@supabase/supabase-js';
import {startSupabaseAuthEnvironment} from '../../server/family/auth-environment.mjs';
import {familyHttpServer} from '../../server/family/http.mjs';
let environment,pool,server,url,owner,member,outsider,budget,foreign,financeBefore;
async function api(session,path,body) {
 const response=await fetch(url+'/family-api'+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json','X-Finown-Local':'1'}),...(session?.token?{Authorization:`Bearer ${session.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await response.json();return {status:response.status,data:result};
}
async function account(email) {
 const auth=new AuthClient({url:environment.authUrl,headers:{apikey:environment.anonKey},persistSession:false,autoRefreshToken:false});
 const result=await auth.signInWithPassword({email,password:'Local-Test-Password-2026'});
 assert.equal(result.error,null);return {id:result.data.user.id,email,token:result.data.session.access_token,refreshToken:result.data.session.refresh_token,auth};
}
async function load(who=owner,id=budget) {const r=await api(who,`/budgets/${id}`);assert.equal(r.status,200);return r.data;}
async function command(who,action,payload={},requestId,id=budget,extra={}) {const s=await load(who,id);return api(who,`/budgets/${id}/command`,{operationId:randomUUID(),command:{action,payload,requestId,version:s.version},environmentVersion:s._server.environmentVersion,...extra});}
async function financeSnapshot(){
 const result={};
 for(const t of ['banks','products','payments','income_sources','expense_sources','subscription_sources','subscription_payments','income_receipts','trackers','available_balances'])result[t]=(await pool.query(`select coalesce(jsonb_agg(to_jsonb(p) order by user_id,id),'[]') value from ${t} p`)).rows[0].value;
 return result;
}
before(async()=>{
 environment=await startSupabaseAuthEnvironment({today:()=> '2026-11-01'});pool=environment.pool;
 server=familyHttpServer(pool,{today:()=> '2026-11-01',authUrl:environment.authUrl,anonKey:environment.anonKey}).server;await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}`;
 owner=await account('owner@family.test');member=await account('member@family.test');outsider=await account('other@family.test');
 budget=(await api(owner,'/budgets',{})).data.id;assert.equal((await api(owner,'/budgets',{})).data.id,budget);foreign=(await api(outsider,'/budgets',{})).data.id;financeBefore=await financeSnapshot();
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await environment?.close();});
test('real Supabase password login, server getUser, refresh and signout; no register/reset routes',async()=>{
 assert.equal((await api(null,'/me')).status,401);
 assert.equal((await api({token:'not-a-supabase-token'},'/me')).status,401);
 assert.equal((await api({token:environment.expiredTokenFor(owner)},'/me')).status,401);
 const wrong=await owner.auth.signInWithPassword({email:owner.email,password:'Wrong-Password-2026'});assert.ok(wrong.error);
 const who=await api(member,'/me');assert.equal(who.data.id,member.id);assert.notEqual(member.token,owner.token);
 const separate=await account(outsider.email);
 const refreshed=await separate.auth.refreshSession();assert.equal(refreshed.error,null);const revoked=refreshed.data.session.refresh_token;
 assert.equal((await separate.auth.signOut({scope:'local'})).error,null);
 const retry=await separate.auth.refreshSession({refresh_token:revoked});assert.ok(retry.error);
 assert.equal((await api(outsider,'/me')).status,200);
 for(const path of ['/register','/login','/logout'])assert.equal((await api(null,path,{})).status,404);
 for(const path of ['/signup','/recover','/invite','/admin/users']){
  const r=await fetch(url+'/auth/v1'+path,{method:'POST',headers:{apikey:environment.anonKey,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,404);
 }
 const denied=await fetch(environment.authUrl+'/signup',{method:'POST',headers:{apikey:environment.anonKey,'Content-Type':'application/json'},body:JSON.stringify({email:'blocked@family.test',password:'Local-Test-Password-2026'})});assert.ok(!denied.ok);
 assert.equal((await fetch(url+'/family-api/budgets',{method:'POST',headers:{Authorization:`Bearer ${owner.token}`}})).status,403);
});
test('only owner invites; wrong account, revoked/expired/used token denied; exactly two members',async()=>{
 assert.equal((await api(member,`/budgets/${budget}/invite`,{email:member.email})).status,403);
 let invite=await api(owner,`/budgets/${budget}/invite`,{email:member.email});assert.equal(invite.status,200);
 assert.equal((await api(outsider,'/accept',{token:invite.data.token})).status,403);
 await api(owner,`/budgets/${budget}/revoke`,{});assert.equal((await api(member,'/accept',{token:invite.data.token})).status,403);
 invite=await api(owner,`/budgets/${budget}/invite`,{email:member.email});
 await pool.query("update family_invitations set expires_at=now()-interval '1 minute' where id=$1",[invite.data.id]);
 assert.equal((await api(member,'/accept',{token:invite.data.token})).status,403);
 invite=await api(owner,`/budgets/${budget}/invite`,{email:member.email});
 const accepted=await Promise.all([api(member,'/accept',{token:invite.data.token}),api(member,'/accept',{token:invite.data.token})]);
 assert.deepEqual(accepted.map(r=>r.status).sort(),[200,403]);
 assert.equal((await api(owner,`/budgets/${budget}/invite`,{email:outsider.email})).status,409);
 const stored=await pool.query('select token_hash from family_invitations where id=$1',[invite.data.id]);assert.notEqual(stored.rows[0].token_hash,invite.data.token);
});
test('shared scope defaults empty, only owner selects; unshared data excluded; foreign family denied',async()=>{
 const empty=await load(member);assert.equal(empty._server.environment.summary.rows.length,0);assert.equal(empty._server.records.length,0);
 assert.equal((await api(member,`/budgets/${foreign}`)).status,403);
 assert.equal((await command(member,'scope',{keys:['balance']})).status,403);
 assert.equal((await command(owner,'scope',{keys:['payments:999999']})).status,400);
 const s=await load();const keys=s._server.records.map(r=>r.key).filter(k=>!k.startsWith('products:12'));
 assert.equal((await command(owner,'scope',{keys:[...keys,'balance']})).status,200);
 const shared=await load(member);assert.ok(shared._server.environment.summary.rows.length);assert.ok(!JSON.stringify(shared).includes('Yerel Sanal Kart'));assert.equal(shared._server.environment.balance.fresh,true);
});
test('server recomputes affordability and roles; forged actor/environment cannot approve',async()=>{
 assert.notEqual((await load(member))._server.environment.sourceBasis,(await pool.query('select data from available_balances where user_id=$1',[owner.id])).rows[0].data.basisFingerprint);
 assert.equal((await command(owner,'policy',{buffer:1000,confirmCoverage:true})).status,200);
 assert.equal((await command(owner,'limit',{cardId:'11',amount:30000,items:{}})).status,200);
 const created=await command(member,'create',{title:'Ortak ihtiyaç',amount:2500,date:'2026-11-01'});assert.equal(created.status,200);const id=created.data.requests.at(-1).id;
 assert.equal((await command(member,'approve',{amount:2500,cardId:'11'},id)).status,403);
 const s=await load();assert.equal((await api(owner,`/budgets/${budget}/command`,{operationId:randomUUID(),command:{action:'approve',version:s.version,requestId:id,payload:{amount:2500,cardId:'11'},actor:owner.id},environmentVersion:s._server.environmentVersion})).status,400);
 assert.equal((await command(owner,'approve',{amount:2500,cardId:'11'},id,budget,{environment:{balance:999999}})).status,400);
 const approved=await command(owner,'approve',{amount:2500,cardId:'11'},id);assert.equal(approved.status,200);assert.equal(approved.data.requests[0].status,'approved');
 const bought=await command(member,'purchase',{amount:2200,date:'2026-11-01',cardId:'11'},id);assert.equal(bought.status,200);assert.equal(bought.data.requests[0].status,'review');
 assert.equal((await command(member,'cancel',{reason:'Yok say'},id)).status,403);
 assert.ok((await load(owner)).notifications.every(n=>n.recipient===owner.id));assert.ok((await load(member)).notifications.every(n=>n.recipient===member.id));
});
test('concurrent reservations serialize, stale financial basis rejected, operation retry idempotent',async()=>{
 const purchased=(await load()).requests[0];await command(owner,'limit',{cardId:'11',amount:27800,items:{[purchased.id]:true}});
 const created=await command(member,'create',{title:'İkinci ihtiyaç',amount:1000,date:'2026-11-01'});const id=created.data.requests.at(-1).id;
 const s=await load(),operationId=randomUUID(),body={operationId,command:{action:'approve',payload:{amount:1000,cardId:'11'},requestId:id,version:s.version},environmentVersion:s._server.environmentVersion};
 const responses=await Promise.all([api(owner,`/budgets/${budget}/command`,body),api(owner,`/budgets/${budget}/command`,{...body,operationId:randomUUID()})]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const retry=await api(owner,`/budgets/${budget}/command`,responses[0].status===200?body:{...body,operationId:(await pool.query("select id from family_operations where budget_id=$1 and body_hash is not null order by ctid desc limit 1",[budget])).rows[0].id});assert.equal(retry.status,200);
 const old=await load();await pool.query("update income_sources set data=jsonb_set(data,'{amount}','24000') where user_id=$1 and data->>'id'='101'",[owner.id]);
 const stale=await api(owner,`/budgets/${budget}/command`,{operationId:randomUUID(),command:{action:'policy',payload:{buffer:1000,confirmCoverage:true},version:old.version},environmentVersion:old._server.environmentVersion});assert.equal(stale.status,409);
 await pool.query("update income_sources set data=jsonb_set(data,'{amount}','25000') where user_id=$1 and data->>'id'='101'",[owner.id]);
});
test('PostgreSQL RLS blocks cross-family, direct writes and private snapshot; history immutable',async()=>{
 const c=await pool.connect();try{
  await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[member.id]);
  assert.equal((await c.query('select id from family_budgets where id=$1',[foreign])).rowCount,0);
  assert.equal((await c.query('select * from family_members where budget_id=$1',[foreign])).rowCount,0);
  await c.query('rollback');
  for(const sql of ['select state from family_budgets','select family_private_finance($1)','update family_budgets set state=state','delete from family_events']){
   await c.query('begin');await c.query('set local role authenticated');await assert.rejects(()=>c.query(sql,sql.includes('$1')?[budget]:[]));await c.query('rollback');
  }
  await assert.rejects(()=>pool.query('update family_events set event=event where budget_id=$1',[budget]),/append-only/);
 }finally{await c.query('rollback').catch(()=>{});c.release();}
});
test('membership removal invalidates existing session access without deleting history/expenses',async()=>{
 const count=(await pool.query('select count(*) from family_events where budget_id=$1',[budget])).rows[0].count;
 assert.equal((await api(owner,`/budgets/${budget}/remove-member`,{})).status,200);
 assert.equal((await api(member,`/budgets/${budget}`)).status,403);
 assert.equal((await api(member,'/me')).status,200);
 assert.ok(Number((await pool.query('select count(*) from family_events where budget_id=$1',[budget])).rows[0].count)>=Number(count));
 assert.equal((await load()).requests[0].purchase.amount,2200);
 assert.deepEqual(await financeSnapshot(),financeBefore);
});

test('production function contract: restricted DB login, genuine Auth, stable cold-start basis and no cross-family access',async()=>{
 const {createFamilyHandler}=await import('../../server/family/production.mjs');
 const {randomBytes}=await import('node:crypto');const pg=await import('pg');
 const password=randomBytes(24).toString('hex');
 const ddl=(await pool.query("select format('create role finown_family_api login noinherit password %L',$1::text)",[password])).rows[0].format;
 await pool.query(ddl);await pool.query('grant family_server to finown_family_api');
 const restricted=new pg.default.Pool({...pool.options,user:'finown_family_api',password,max:1});
 try {
  await assert.rejects(()=>restricted.query('select * from payments'));
  const config={pool:restricted,authUrl:environment.authUrl,anonKey:environment.anonKey,fingerprintKey:'local-only-test-fingerprint-key-1234567890',origins:['https://finown.netlify.app']};
  const handler=createFamilyHandler(config),second=createFamilyHandler(config);
  const request=(path,who=owner,options={})=>new Request('https://finown.netlify.app'+path,{headers:{...(who?{Authorization:`Bearer ${who.token}`}:{})},...options});
  assert.equal((await handler(request('/family-api/me',null))).status,401);
  assert.equal((await handler(request('/family-api/budgets/'+foreign))).status,403);
  assert.equal((await handler(request('/family-api/budgets',owner,{headers:{Origin:'https://other.invalid',Authorization:`Bearer ${owner.token}`}}))).status,403);
  const a=await (await handler(request('/family-api/budgets/'+budget))).json();
  const b=await (await second(request('/family-api/budgets/'+budget))).json();
  assert.equal(a._server.environmentVersion,b._server.environmentVersion);
  assert.equal((await handler(request('/.netlify/functions/family/budgets'))).status,200);
  const history=await handler(request('/.netlify/functions/family/budgets/'+budget+'/history?period=2024-01'));assert.equal(history.status,200);assert.equal((await history.json()).rows.length,2);
  assert.equal((await handler(request('/family-api/budgets/'+foreign+'/history'))).status,403);
  assert.deepEqual(await financeSnapshot(),financeBefore);
 }finally{await restricted.end();}
});
