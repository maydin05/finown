import http from 'node:http';
import { FamilyService,problem } from './service.mjs';
import {familyRoute} from './routes.mjs';
import {memberAccountCreator} from './member-account.mjs';
import {supabaseIdentity} from './supabase-auth.mjs';
async function jsonBody(req) {
 let text='';for await(const chunk of req) {text+=chunk;if(Buffer.byteLength(text)>64000)throw problem('İstek çok büyük.',413);}
 try{return JSON.parse(text || '{}');}catch{throw problem('Geçersiz istek.');}
}
export function familyHttpServer(pool,{today,authUrl,anonKey,adminKey,accountCreators=[]}={}) {
 if(!authUrl || !anonKey)throw new Error('Supabase Auth yapılandırması gerekli.');
 const service=new FamilyService(pool,{today,accountCreators,createMemberAccount:memberAccountCreator({url:authUrl,adminKey})}),userFor=supabaseIdentity({url:authUrl,anonKey});
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try {
   // Local API boundary; identity is verified against the actual Supabase Auth provider.
   if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host || ''))throw problem('Yalnız yerel erişim.',403);
   const path=new URL(req.url,'http://127.0.0.1').pathname;
   if(path==='/family-api/auth-config' && req.method==='GET')return reply(200,{local:true,anonKey});
   if(path.startsWith('/auth/v1/')) {
    const endpoint=path.slice('/auth/v1'.length),query=new URL(req.url,'http://127.0.0.1').searchParams;
    const allowed=(req.method==='POST' && endpoint==='/token' && ['password','refresh_token'].includes(query.get('grant_type'))) || (req.method==='GET' && endpoint==='/user') || (req.method==='POST' && endpoint==='/logout');
    if(!allowed)throw problem('Bu giriş işlemi açık değil.',404);
    if(req.headers.apikey!==anonKey)throw problem('Auth istemcisi doğrulanamadı.',401);
    if(req.headers.origin && !/^http:\/\/127\.0\.0\.1:(5173|5175|8784)$/.test(req.headers.origin))throw problem('Kaynak doğrulanamadı.',403);
    const body=req.method==='POST'?await jsonBody(req):undefined;
    const upstream=await fetch(`${authUrl}${endpoint}?${query}`,{method:req.method,headers:{apikey:anonKey,Authorization:req.headers.authorization || `Bearer ${anonKey}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
    return reply(upstream.status,upstream.status===204?{}:await upstream.json());
   }
   if(req.method!=='GET') {
    if(req.headers['x-finown-local']!=='1' && req.headers['x-finown-request']!=='1')throw problem('İstek doğrulanamadı.',403);
    if(req.headers.origin && !/^http:\/\/127\.0\.0\.1:(5173|5175|8784)$/.test(req.headers.origin))throw problem('Kaynak doğrulanamadı.',403);
    if(!/^application\/json(?:;|$)/.test(req.headers['content-type'] || ''))throw problem('JSON gerekli.',415);
   }
   if(path==='/family-api/health' && req.method==='GET')return reply(200,{local:true});
   if(['/family-api/register','/family-api/login','/family-api/logout'].includes(path))throw problem('Bu giriş işlemi açık değil.',404);
   const user=await userFor(req);
   return reply(200,await familyRoute(service,user,{method:req.method,path,body:req.method==='POST'?await jsonBody(req):undefined}));
  }catch(e){reply(e.status || 500,{error:e.status?e.message:'Yerel sunucu işlemi tamamlanamadı.'});}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 return {server,service};
}
