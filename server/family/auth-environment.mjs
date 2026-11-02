// Real Supabase Auth (GoTrue), private disposable PostgreSQL, no production configuration.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes,randomUUID,createHmac} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {seedLocalFinance} from './fixtures.mjs';
import {localToday} from '../../src/family/model.js';
const exec=promisify(execFile);
const docker=async(...args)=>{try{return (await exec('docker',args,{maxBuffer:1000000,detached:true})).stdout.trim();}catch{throw new Error('Yerel Docker işlemi başarısız.');}};
const AUTH_IMAGE='public.ecr.aws/supabase/gotrue:v2.195.0';
function jwt(secret,role,claims={}) {
 const b=v=>Buffer.from(JSON.stringify(v)).toString('base64url');const now=Math.floor(Date.now()/1000),text=`${b({alg:'HS256',typ:'JWT'})}.${b({iss:'supabase-local',role,iat:now,exp:now+86400,...claims})}`;
 return `${text}.${createHmac('sha256',secret).update(text).digest('base64url')}`;
}
export async function startSupabaseAuthEnvironment({today=localToday,fixtures=true}={}) {
 const suffix=randomUUID(),network=`finown-auth-${suffix}`,password=randomBytes(24).toString('hex'),secret=randomBytes(48).toString('hex');
 const anonKey=jwt(secret,'anon'),adminKey=jwt(secret,'service_role');
 let database,provider,pool;
 const close=async()=>{await pool?.end();if(provider)await docker('stop',provider).catch(()=>{});if(database)await docker('stop',database).catch(()=>{});await docker('network','rm',network).catch(()=>{});};
 try {
  await docker('network','create','--label','finown.auth.local=true',network);
  database=await docker('run','--detach','--rm','--label','finown.auth.local=true','--network',network,'--network-alias','db','--env',`POSTGRES_PASSWORD=${password}`,'-p','127.0.0.1::5432','postgres:18');
  const port=Number((await docker('port',database,'5432/tcp')).split(':').at(-1));pool=new pg.Pool({host:'127.0.0.1',port,user:'postgres',password,database:'postgres',max:8,connectionTimeoutMillis:1500});
  let ready=false;for(let i=0;i<90;i++){try{await pool.query('select 1');ready=true;break;}catch{await new Promise(r=>setTimeout(r,200));}}if(!ready)throw new Error('Yerel PostgreSQL hazır değil.');
  await pool.query('create schema auth');
  provider=await docker('run','--detach','--rm','--label','finown.auth.local=true','--network',network,'-p','127.0.0.1::9999',
   '--env','GOTRUE_API_HOST=0.0.0.0','--env','GOTRUE_API_PORT=9999',
   '--env','API_EXTERNAL_URL=http://127.0.0.1:8784/auth/v1','--env','GOTRUE_SITE_URL=http://127.0.0.1:5175',
   '--env','GOTRUE_DB_DRIVER=postgres','--env',`GOTRUE_DB_DATABASE_URL=postgres://postgres:${password}@db:5432/postgres?search_path=auth`,
   '--env',`GOTRUE_JWT_SECRET=${secret}`,'--env','GOTRUE_JWT_ADMIN_ROLES=service_role','--env','GOTRUE_JWT_AUD=authenticated','--env','GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated','--env','GOTRUE_JWT_EXP=900',
   '--env','GOTRUE_JWT_ISSUER=http://127.0.0.1:8784/auth/v1',
   '--env','GOTRUE_DISABLE_SIGNUP=true','--env','GOTRUE_EXTERNAL_EMAIL_ENABLED=true','--env','GOTRUE_EXTERNAL_PHONE_ENABLED=false',
   '--env','GOTRUE_MAILER_AUTOCONFIRM=false','--env','GOTRUE_SMTP_HOST=','--env','GOTRUE_SMTP_ADMIN_EMAIL=',AUTH_IMAGE);
  const authPort=Number((await docker('port',provider,'9999/tcp')).split(':').at(-1)),authUrl=`http://127.0.0.1:${authPort}`;
  ready=false;for(let i=0;i<120;i++){try{if((await fetch(authUrl+'/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw new Error('Yerel Supabase Auth hazır değil.');
  // Only local finance fixtures, after GoTrue itself has built auth.users and auth.sessions.
  for(const path of ['tests/family/local-bootstrap.sql','supabase/migrations/202611010004_family_budget.sql'])await pool.query(await readFile(path,'utf8'));
  const provision=async(email,passphrase,{confirmed=true}={})=>{
   if(!/^[^\s@]+@[^\s@]+\.test$/.test(email))throw new Error('Only local .test fixtures');
   const response=await fetch(authUrl+'/admin/users',{method:'POST',headers:{Authorization:`Bearer ${adminKey}`,'Content-Type':'application/json'},body:JSON.stringify({email,password:passphrase,email_confirm:confirmed})});
   const result=await response.json();if(!response.ok)throw new Error('Yerel test hesabı hazırlanamadı.');
   await seedLocalFinance(pool,result.id,today());return result;
  };
  const accounts=[];
  if(fixtures)for(const email of ['owner@family.test','member@family.test','other@family.test',...[320,375,430].flatMap(w=>[`owner-${w}@family.test`,`member-${w}@family.test`])]){await provision(email,'Local-Test-Password-2026');accounts.push({email});}
  return {pool,authUrl,anonKey,accounts,provision,close,expiredTokenFor:user=>jwt(secret,'authenticated',{sub:user.id,email:user.email,aud:'authenticated',exp:Math.floor(Date.now()/1000)-30}),containers:[database,provider],image:AUTH_IMAGE};
 }catch(error){await close();throw error;}
}
