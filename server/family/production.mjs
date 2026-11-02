import {FamilyService,problem} from './service.mjs';
import {familyRoute} from './routes.mjs';
import {memberAccountCreator} from './member-account.mjs';
import {supabaseIdentity} from './supabase-auth.mjs';
export function createFamilyHandler({pool,authUrl,anonKey,fingerprintKey,origins,adminKey,accountCreators=[]}) {
 if(!fingerprintKey || fingerprintKey.length<32)throw new Error('Kalıcı finans anahtarı gerekli.');
 const service=new FamilyService(pool,{fingerprintKey,testEmailsOnly:false,createMemberAccount:memberAccountCreator({url:authUrl,adminKey}),accountCreators});
 const identify=supabaseIdentity({url:authUrl,anonKey});
 return async request=>{
  const reply=(status,data)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  try {
   const origin=request.headers.get('origin');if(origin && !origins.includes(origin))throw problem('Kaynak doğrulanamadı.',403);
   const path=new URL(request.url).pathname.replace(/^\/.netlify\/functions\/family/,'/family-api');
   if(!['GET','POST'].includes(request.method))throw problem('İşlem yöntemi geçersiz.',405);
   if(path==='/family-api/health'){await pool.query('select 1');return reply(200,{ready:true});}
   const user=await identify({headers:{authorization:request.headers.get('authorization')}});
   let body;
   if(request.method==='POST') {
    if(request.headers.get('X-Finown-Request')!=='1' && request.headers.get('X-Finown-Local')!=='1')throw problem('İstek doğrulanamadı.',403);
    if(!/^application\/json(?:;|$)/.test(request.headers.get('content-type') || ''))throw problem('JSON gerekli.',415);
    const text=await request.text();if(Buffer.byteLength(text)>64000)throw problem('İstek çok büyük.',413);
    try{body=JSON.parse(text || '{}');}catch{throw problem('Geçersiz istek.');}
   }
   return reply(200,await familyRoute(service,user,{path,method:request.method,body}));
  } catch(error) {return reply(error.status || 503,{error:error.status?error.message:'İşlem tamamlanamadı. Biraz sonra tekrar dene.'});}
 };
}
