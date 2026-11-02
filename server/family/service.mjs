import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { newFamily, transitionFamily, localToday } from '../../src/family/model.js';
import { personalEnvironment, selectableRecords } from '../../src/family/environment.js';
import { balanceBasis, hashBalanceBasis } from '../../src/domain/availableBalance.js';
export const digest = value => createHash('sha256').update(value).digest('hex');
export function problem(message,status=400) { return Object.assign(new Error(message),{status,userMessage:message}); }
const camel = key=>key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
const mapRow = row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[camel(k),v]));
export class FamilyService {
 constructor(pool,{today=localToday,fingerprintKey,testEmailsOnly=true}={}) { this.pool=pool;this.today=today;this.fingerprintKey=fingerprintKey || randomBytes(32);this.testEmailsOnly=testEmailsOnly; }
 async transaction(user,callback) {
  const c=await this.pool.connect();
  try {
   await c.query('BEGIN');await c.query("SET LOCAL statement_timeout='8s'");await c.query("SET LOCAL lock_timeout='4s'");
   await c.query('SET LOCAL ROLE family_server');await c.query("select set_config('request.jwt.claim.sub',$1,true)",[user.id]);
   const result=await callback(c);await c.query('COMMIT');return result;
  } catch(e) {await c.query('ROLLBACK');throw e;} finally {c.release();}
 }
 async budget(c,id,user,{lock=false,owner=false}={}) {
  if(!/^[a-f0-9-]{36}$/i.test(id || '')) throw problem('Bütçe bulunamadı.',404);
  const q=await c.query(`select b.* from family_budgets b where b.id=$1 and exists(select 1 from family_members m where m.budget_id=b.id and m.user_id=$2) ${lock?'for update of b':''}`,[id,user.id]);
  const b=q.rows[0];if(!b || (owner && b.owner_id!==user.id)) throw problem('Bütçe bulunamadı veya yetkin yok.',403);
  return b;
 }
 async environment(c,b) {
  // A concurrent private-finance writer cannot change the basis between assessment and commit.
  const {rows}=await c.query('select family_private_finance($1) as data',[b.id]);
  const data={};
  for(const [name,records] of Object.entries(rows[0].data)) {
   // JSON 'data' wrappers exist ONLY in the disposable local fixture; real schemas are flat.
   data[camel(name)]=records.map(r=>mapRow(r.data ? {...r.data,id:r.data.id ?? r.id,user_id:r.user_id}:r)).sort((a,b)=>String(a.id ?? a.key ?? '').localeCompare(String(b.id ?? b.key ?? '')));
  }
  data.statusTracker=Object.fromEntries(data.trackers.map(r=>[r.key,r.value]));data.availableBalance=data.availableBalances[0] || null;
  const fingerprint=await hashBalanceBasis(balanceBasis(data));
  const env=personalEnvironment(data,b.state.scope,fingerprint,this.today());
  // A raw private-finance digest could allow guessing an unshared amount offline.
  const opaque=value=>createHmac('sha256',this.fingerprintKey).update(value).digest('hex');
  env.sourceBasis=opaque(env.sourceBasis);
  if(env.balance)env.balance.token=opaque(env.balance.token);
  return {env,records:selectableRecords(data)};
 }
 publicState(b,user,context) {
  const state=structuredClone(b.state);
  state.notifications=state.notifications.filter(n=>n.recipient===user.id);
  delete state.operations;
  return {...state,_server:{actor:user.id,role:b.owner_id===user.id?'owner':'requester',environment:context.env,environmentVersion:digest(JSON.stringify(context.env)),records:b.owner_id===user.id?context.records:[]}};
 }
 async list(user) {return this.transaction(user,async c=>(await c.query('select b.id,b.owner_id,b.created_at from family_budgets b join family_members m on m.budget_id=b.id where m.user_id=$1 order by b.created_at',[user.id])).rows);}
 async create(user) {return this.transaction(user,async c=>{
  const id=randomUUID(),state=newFamily(id);state.owner=user.id;state.requester=null;
  const inserted=await c.query('insert into family_budgets(id,owner_id,state) values($1,$2,$3) on conflict(owner_id) do nothing returning id',[id,user.id,state]);
  if(!inserted.rowCount)return (await c.query('select id from family_budgets where owner_id=$1',[user.id])).rows[0];
  await c.query("insert into family_members values($1,$2,'owner')",[id,user.id]);return {id};
 });}
 async load(user,id) {return this.transaction(user,async c=>{const b=await this.budget(c,id,user);return this.publicState(b,user,await this.environment(c,b));});}
 async dispatch(user,id,body) {return this.transaction(user,async c=>{
  if(!body || !/^[a-f0-9-]{36}$/i.test(body.operationId || '') || !body.command || Object.keys(body).some(k=>!['operationId','command','environmentVersion'].includes(k))) throw problem('Geçersiz işlem.');
  const b=await this.budget(c,id,user,{lock:true});
  const hash=digest(JSON.stringify(body.command));
  const existing=(await c.query('select * from family_operations where budget_id=$1 and id=$2',[id,body.operationId])).rows[0];
  if(existing) {
   if(existing.actor_id!==user.id || existing.body_hash!==hash) throw problem('İşlem kimliği farklı içerikle kullanılmış.',409);
   return this.publicState(b,user,await this.environment(c,b));
  }
  const context=await this.environment(c,b);
  if(body.environmentVersion!==digest(JSON.stringify(context.env))) throw problem('Finansal veriler değişti. Güncel bütçeyi yeniden kontrol et.',409);
  if(Object.keys(body.command).some(k=>!['action','payload','requestId','version'].includes(k))) throw problem('İzin verilmeyen işlem alanı.');
  const command=structuredClone(body.command);
  if(command.action==='scope') {
   if(!Array.isArray(command.payload?.keys) || command.payload.keys.some(k=>!context.records.some(r=>r.key===k) && k!=='balance')) throw problem('Başka hesaba ait veya geçersiz kayıt seçilemez.');
  }
  let state;
  try {state=transitionFamily(b.state,user.id,command,context.env,{id:body.operationId,at:new Date().toISOString()});}
  catch(e) {throw problem(e.userMessage || 'İşlem geçersiz.', /oturumda|sürüm/.test(e.message)?409:403);}
  const event=state.events.at(-1);
  await c.query('insert into family_events(id,budget_id,actor_id,event) values($1,$2,$3,$4)',[event.id,id,user.id,event]);
  await c.query('insert into family_operations values($1,$2,$3,$4)',[id,body.operationId,user.id,hash]);
  await c.query('update family_budgets set state=$2 where id=$1',[id,state]);b.state=state;
  return this.publicState(b,user,await this.environment(c,b));
 });}
 async invite(user,id,email) {return this.transaction(user,async c=>{
  const b=await this.budget(c,id,user,{lock:true,owner:true});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || email.length>254 || (this.testEmailsOnly && !email.endsWith('.test'))) throw problem(this.testEmailsOnly ? 'Yerel davet için .test uzantılı test hesabı kullan.' : 'Geçerli bir e-posta adresi gerekli.');
  if(b.state.requester) throw problem('Bu bütçenin ikinci üyesi zaten var.',409);
  const {randomBytes}=await import('node:crypto');const token=randomBytes(32).toString('hex');
  await c.query('update family_invitations set revoked_at=now() where budget_id=$1 and accepted_at is null and revoked_at is null',[id]);
  const result=await c.query("insert into family_invitations(budget_id,email,token_hash,expires_at) values($1,$2,$3,now()+interval '24 hours') returning id,expires_at",[id,email.toLowerCase(),digest(token)]);
  await this.audit(c,b,user,'invite-created','Davet bağlantısı oluşturuldu; e-posta gönderilmedi');
  return {...result.rows[0],token};
 });}
 async accept(user,token) {return this.transaction(user,async c=>{
  if(!/^[a-f0-9]{64}$/.test(token || '')) throw problem('Davet geçersiz.',403);
  // Always lock budget BEFORE invitation, matching creation/revocation order.
  const found=(await c.query('select budget_id from family_invitations where token_hash=$1',[digest(token)])).rows[0];
  if(!found) throw problem('Davet geçersiz.',403);
  const b=(await c.query('select * from family_budgets where id=$1 for update',[found.budget_id])).rows[0];
  const inv=(await c.query('select * from family_invitations where token_hash=$1 for update',[digest(token)])).rows[0];
  if(!user.verified || inv.email!==user.email.toLowerCase() || inv.revoked_at || inv.accepted_at || new Date(inv.expires_at)<=new Date() || b.owner_id===user.id || b.state.requester) throw problem('Davet bu hesap için geçerli değil veya süresi dolmuş.',403);
  await c.query("insert into family_members values($1,$2,'requester')",[b.id,user.id]);
  await c.query('update family_invitations set accepted_at=now(),accepted_by=$2 where id=$1',[inv.id,user.id]);
  b.state.requester=user.id;await this.audit(c,b,user,'invite-accepted','İkinci üye bütçeye katıldı');
  return {id:b.id};
 });}
 async revokeInvite(user,id) {return this.transaction(user,async c=>{
  const b=await this.budget(c,id,user,{lock:true,owner:true});
  await c.query('update family_invitations set revoked_at=now() where budget_id=$1 and accepted_at is null and revoked_at is null',[id]);
  await this.audit(c,b,user,'invite-revoked','Bekleyen davetler geri çekildi');return {ok:true};
 });}
 async removeMember(user,id) {return this.transaction(user,async c=>{
  const b=await this.budget(c,id,user,{lock:true,owner:true});
  await c.query("delete from family_members where budget_id=$1 and role='requester'",[id]);
  b.state.requester=null;await this.audit(c,b,user,'member-removed','İkinci üyenin erişimi kaldırıldı; geçmiş ve harcamalar korundu');return {ok:true};
 });}
 async audit(c,b,user,action,detail) {
  const event={id:randomUUID(),actor:user.id,action,detail,at:new Date().toISOString(),version:++b.state.version};b.state.events.push(event);
  await c.query('insert into family_events values($1,$2,$3,$4,now())',[event.id,b.id,user.id,event]);
  await c.query('update family_budgets set state=$2 where id=$1',[b.id,b.state]);
 }
}
