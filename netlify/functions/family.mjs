import process from 'node:process';
import pg from 'pg';
import {supabaseSSL} from '../../server/family/ssl.mjs';
import {createFamilyHandler} from '../../server/family/production.mjs';
let handle;
export default async request=>{
 try {
  if(!handle) {
   const {FINOWN_FAMILY_DATABASE_URL:connectionString,FINOWN_FAMILY_FINGERPRINT_KEY:fingerprintKey,FINOWN_SUPABASE_ANON_KEY:anonKey}=process.env;
   if(!connectionString || !fingerprintKey || !anonKey)throw new Error('Configuration missing');
   const url=new URL(connectionString);
   if(url.username!=='finown_family_api.zowlpzmvwiszwhtvsagj' || url.hostname!=='aws-1-ap-southeast-1.pooler.supabase.com')throw new Error('Wrong database target');
   const pool=new pg.Pool({connectionString,ssl:supabaseSSL,max:1,idleTimeoutMillis:1000,connectionTimeoutMillis:8000,allowExitOnIdle:true});
   handle=createFamilyHandler({pool,authUrl:'https://zowlpzmvwiszwhtvsagj.supabase.co/auth/v1',anonKey,fingerprintKey,origins:['https://finown.netlify.app']});
  }
  return await handle(request);
 }catch{return Response.json({error:'Aile bütçesi hizmeti şu anda kullanılamıyor.'},{status:503,headers:{'Cache-Control':'no-store'}});}
};
