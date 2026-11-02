import {AuthClient} from '@supabase/supabase-js';
import {problem} from './service.mjs';
// Fixed provider URL and anon/publishable key, never a URL or user ID supplied by the browser.
export function supabaseIdentity({url,anonKey}) {
 const auth=new AuthClient({url,headers:{apikey:anonKey},persistSession:false,autoRefreshToken:false,detectSessionInUrl:false});
 return async req=>{
  const match=req.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
  if(!match || match[1].length>8000)throw problem('Giriş yapman gerekli.',401);
  let result;
  try {result=await auth.getUser(match[1]);}catch{throw problem('Oturum doğrulanamadı.',401);}
  const user=result?.data?.user;
  if(result?.error || !user?.id || !user.email || user.is_anonymous || user.role!=='authenticated' || !user.email_confirmed_at)throw problem('Oturum geçersiz veya süresi dolmuş.',401);
  return {id:user.id,email:user.email,verified:true};
 };
}
