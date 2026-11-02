// Isolated local Supabase Auth + family API. No .env, production profile, SMTP or signup.
import process from 'node:process';
import {writeFile,mkdir} from 'node:fs/promises';
import {startSupabaseAuthEnvironment} from './auth-environment.mjs';
import {familyHttpServer} from './http.mjs';
const port=Number(process.env.FINOWN_FAMILY_PORT || 8784);
if(![8784,8786].includes(port))throw new Error('Yerel port geçersiz.');
let environment,server,stopping=false;
async function cleanup(){await new Promise(r=>server?server.close(r):r());await environment?.close();}
try {
 environment=await startSupabaseAuthEnvironment();
 const accountCreators=(await environment.pool.query("select id from auth.users where email ~ '^owner(-[0-9]+)?@family[.]test$'")).rows.map(r=>r.id);
 server=familyHttpServer(environment.pool,{authUrl:environment.authUrl,anonKey:environment.anonKey,adminKey:environment.adminKey,accountCreators}).server;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 await mkdir('docs/private.local',{recursive:true});
 if(port===8784)await writeFile('docs/private.local/family-runtime.local.json',JSON.stringify({containers:environment.containers,authImage:environment.image}),{mode:0o600});
 console.log(`Yerel Supabase Auth ve aile API hazır: http://127.0.0.1:${port}/family-api/health · kayıt/sıfırlama/e-posta yok.`);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(stopping)return;stopping=true;cleanup().finally(()=>process.exit(0));});
}catch{console.error('Yerel Auth ortamı başlatılamadı.');await cleanup();process.exitCode=1;}
