import {AuthClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
import {problem} from './service.mjs';
// A stable provider ID lets a retry recover ONLY this budget's newly created account.
// Provider-owned app_metadata cannot be forged by an ordinary signed-in user.
export function memberAccountId(budgetId) {
 const hex=createHash('sha256').update(`finown:family-member:v1:${budgetId}`).digest('hex');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}
export function memberAccountCreator({url,adminKey}) {
 if(!adminKey)return null;
 const auth=new AuthClient({url,headers:{apikey:adminKey,Authorization:`Bearer ${adminKey}`},persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(6000)})});
 return async ({budgetId,ownerId,email,password})=>{
  const id=memberAccountId(budgetId);
  let existing;
  try {existing=await auth.admin.getUserById(id);}catch{throw problem('Hesap durumu doğrulanamadı. Biraz sonra yeniden dene; ilk oluşturulan şifre korunur.',503);}
  if(existing.data?.user) {
   const u=existing.data.user;
   if(u.email?.toLowerCase()!==email || u.app_metadata?.finown_family_budget!==budgetId || u.app_metadata?.finown_family_owner!==ownerId || !u.email_confirmed_at)throw problem('Bu bütçe için farklı bir hesap zaten hazırlanmış. Mevcut hesap için davet bağlantısını kullan.',409);
   return {id:u.id,email,recovered:true};
  }
  if(existing.error && existing.error.status!==404)throw problem('Hesap hizmetine ulaşılamadı. Biraz sonra tekrar dene.',503);
  let result;
  try {result=await auth.admin.createUser({id,email,password,email_confirm:true,app_metadata:{finown_family_budget:budgetId,finown_family_owner:ownerId}});}catch{throw problem('Hesap durumu doğrulanamadı. Biraz sonra yeniden dene; ilk oluşturulan şifre korunur.',503);}
  if(result.error) {
   if(['email_exists','user_already_exists'].includes(result.error.code))throw problem('Bu e-posta zaten bir hesaba ait. Şifresi değiştirilmedi; mevcut hesap için davet bağlantısını kullan.',409);
   throw problem('Hesap oluşturma tamamlanamadı. E-posta ve şifreyi kontrol edip yeniden dene; daha önce oluşan hesabın ilk şifresi korunur.',503);
  }
  if(result.data?.user?.id!==id || !result.data.user.email_confirmed_at)throw problem('Hesap durumu doğrulanamadı. Biraz sonra yeniden dene; ilk oluşturulan şifre korunur.',503);
  return {id,email,recovered:false};
 };
}
