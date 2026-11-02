import {supabase} from '../lib/supabase';
import {createClient} from '@supabase/supabase-js';
let promise;
export function familyAuth(existingAuth) {
 if(existingAuth){promise=Promise.resolve(existingAuth);return promise;}
 if(!import.meta.env.DEV){promise=Promise.resolve(supabase.auth);return promise;}
 if(!promise)promise=(async()=>{
  const response=await fetch('/family-api/auth-config',{cache:'no-store'});
  if(!response.ok)throw new Error('Yerel Supabase Auth hazır değil.');
  const config=await response.json();
  if(config.local!==true || !config.anonKey)throw new Error('Auth yapılandırması doğrulanamadı.');
  return createClient(window.location.origin,config.anonKey,{auth:{storageKey:'finown-family-supabase-local',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}).auth;
 })().catch(error=>{promise=null;throw error;});
 return promise;
}
