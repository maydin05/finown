import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {AuthClient} from '@supabase/supabase-js';
import {startSupabaseAuthEnvironment} from '../../server/family/auth-environment.mjs';
import {familyHttpServer} from '../../server/family/http.mjs';
import {memberAccountCreator,memberAccountId} from '../../server/family/member-account.mjs';
import {FamilyService,problem} from '../../server/family/service.mjs';
import {createFamilyHandler} from '../../server/family/production.mjs';
let env,server,url,owner,other,budget,beforeFinance;
const password='Local-Test-Password-2026';
function client(){return new AuthClient({url:env.authUrl,headers:{apikey:env.anonKey},persistSession:false,autoRefreshToken:false});}
async function login(email,pass=password){const auth=client(),r=await auth.signInWithPassword({email,password:pass});assert.equal(r.error,null);return {...r.data.user,token:r.data.session.access_token,auth};}
async function api(who,path,body){const r=await fetch(url+'/family-api'+path,{method:body===undefined?'GET':'POST',headers:{...(who?{Authorization:`Bearer ${who.token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json','X-Finown-Request':'1'})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function finance(){const data={};for(const table of ['banks','products','payments','income_sources','expense_sources','subscription_sources','subscription_payments','income_receipts','trackers','available_balances'])data[table]=(await env.pool.query(`select coalesce(jsonb_agg(to_jsonb(t) order by id,user_id),'[]') value from ${table} t`)).rows[0].value;return data;}
async function users(){return (await env.pool.query('select count(*)::int n from auth.users')).rows[0].n;}
before(async()=>{
 env=await startSupabaseAuthEnvironment();owner=await login('owner@family.test');other=await login('other@family.test');
 server=familyHttpServer(env.pool,{authUrl:env.authUrl,anonKey:env.anonKey,adminKey:env.adminKey,accountCreators:[owner.id]}).server;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}`;
 budget=(await api(owner,'/budgets',{})).data.id;beforeFinance=await finance();
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await env?.close();});
test('only configured principal AND budget owner can provision; no public admin/signup route',async()=>{
 const n=await users(),foreign=(await api(other,'/budgets',{})).data.id;
 assert.equal((await api(owner,'/me')).data.canCreateMemberAccount,true);
 assert.equal((await api(other,'/me')).data.canCreateMemberAccount,false);
 const body={email:'denied@family.test',password};
 assert.equal((await api(null,`/budgets/${budget}/create-member`,body)).status,401);
 assert.equal((await api(other,`/budgets/${foreign}/create-member`,body)).status,403);
 assert.equal((await api(owner,`/budgets/${foreign}/create-member`,body)).status,403);
 assert.equal((await api(other,`/budgets/${budget}/create-member`,{...body,ownerId:owner.id})).status,403);
 assert.equal(await users(),n);
});
test('invalid inputs and an existing email never create an account or change its password',async()=>{
 const n=await users();
 for(const body of [{email:owner.email,password},{email:'bad',password},{email:'bad@family.test',password:'short'},{email:'bad@family.test',password:'ş'.repeat(40)},{email:'bad@family.test',password,role:'service_role'}])assert.equal((await api(owner,`/budgets/${budget}/create-member`,body)).status,400);
 const r=await api(owner,`/budgets/${budget}/create-member`,{email:other.email,password:'Different-Password-2026'});
 assert.equal(r.status,409);assert.ok(!JSON.stringify(r).includes('Different-Password'));
 await login(other.email);assert.equal(await users(),n);
 assert.equal((await api(owner,`/budgets/${budget}`)).data.requester,null);
});
test('real no-mail confirmed account: concurrent clicks create once, attach once, empty sharing, normal login',async()=>{
 const n=await users();await api(owner,`/budgets/${budget}/invite`,{email:other.email});
 const body={email:'spouse@family.test',password};
 const result=await Promise.all([api(owner,`/budgets/${budget}/create-member`,body),api(owner,`/budgets/${budget}/create-member`,body)]);
 assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);assert.equal(await users(),n+1);
 const spouse=await login(body.email);assert.equal(spouse.id,memberAccountId(budget));assert.ok(spouse.email_confirmed_at);assert.equal(spouse.role,'authenticated');
 const state=(await api(spouse,`/budgets/${budget}`)).data;assert.equal(state._server.role,'requester');assert.deepEqual(state.scope,[]);assert.deepEqual(state._server.records,[]);
 assert.equal((await api(spouse,`/budgets/${budget}/create-member`,{email:'blocked@family.test',password})).status,403);
 assert.equal((await env.pool.query('select count(*)::int n from family_invitations where budget_id=$1 and revoked_at is null',[budget])).rows[0].n,0);
 assert.ok(!JSON.stringify(state).includes(password));assert.ok(!JSON.stringify(state).includes(body.email));
 assert.deepEqual(await finance(),beforeFinance);
 await api(owner,`/budgets/${budget}/remove-member`,{});
 assert.equal((await api(owner,`/budgets/${budget}/create-member`,{email:'another@family.test',password})).status,409);
 assert.equal((await api(spouse,`/budgets/${budget}`)).status,403);await login(body.email);
});
test('provider success + DB rollback recovers the same marked account, never resets password or creates twice',async()=>{
 const actor=await login('owner-320@family.test');
 const create=memberAccountCreator({url:env.authUrl,adminKey:env.adminKey});let fail=true;
 const service=new FamilyService(env.pool,{accountCreators:[actor.id],createMemberAccount:async args=>{const r=await create(args);if(fail){fail=false;throw problem('simulated interruption',503);}return r;}});
 const id=(await service.create(actor)).id,n=await users();
 await assert.rejects(()=>service.createMember(actor,id,{email:'recovered@family.test',password}),/simulated/);
 assert.equal((await service.load(actor,id)).requester,null);assert.equal(await users(),n+1);
 const result=await service.createMember(actor,id,{email:'recovered@family.test',password:'A-Different-Password-2026'});assert.equal(result.recovered,true);assert.equal(await users(),n+1);
 await login('recovered@family.test');assert.ok((await client().signInWithPassword({email:'recovered@family.test',password:'A-Different-Password-2026'})).error);
 assert.deepEqual(await finance(),beforeFinance);
});
test('production handler keeps capability off by default; actual route uses verified actor and never returns credentials',async()=>{
 const actor=await login('owner-430@family.test');
 const base={pool:env.pool,authUrl:env.authUrl,anonKey:env.anonKey,fingerprintKey:'local-production-key-at-least-32-characters',origins:['https://finown.netlify.app']};
 const disabled=createFamilyHandler(base),enabled=createFamilyHandler({...base,adminKey:env.adminKey,accountCreators:[actor.id]});
 const req=(path,body,origin='https://finown.netlify.app')=>new Request('https://finown.netlify.app/family-api'+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${actor.token}`,Origin:origin,'X-Finown-Request':'1','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 assert.equal((await (await disabled(req('/me'))).json()).canCreateMemberAccount,false);
 const id=(await (await enabled(req('/budgets',{}))).json()).id,body={email:'production-spouse@family.test',password};
 assert.equal((await disabled(req(`/budgets/${id}/create-member`,body))).status,403);
 assert.equal((await enabled(req(`/budgets/${id}/create-member`,body,'https://foreign.invalid'))).status,403);
 const response=await enabled(req(`/budgets/${id}/create-member`,body));assert.equal(response.status,200);const text=await response.text();assert.ok(!text.includes(password));assert.ok(!text.includes(body.email));
 await login(body.email);assert.deepEqual(await finance(),beforeFinance);
});
