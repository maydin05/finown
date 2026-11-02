import {problem} from './service.mjs';
export async function familyRoute(service,user,{method,path,body}) {
 if(path==='/family-api/me' && method==='GET')return {...user,canCreateMemberAccount:service.canCreateMemberAccount(user)};
 if(path==='/family-api/budgets' && method==='GET')return service.list(user);
 if(path==='/family-api/budgets' && method==='POST')return service.create(user);
 if(path==='/family-api/accept' && method==='POST')return service.accept(user,body?.token);
 const match=path.match(/^\/family-api\/budgets\/([a-f0-9-]{36})(?:\/(command|invite|revoke|remove-member|create-member))?$/i);
 if(!match)throw problem('Adres bulunamadı.',404);
 const [,id,action]=match;
 if(!action && method==='GET')return service.load(user,id);
 if(method!=='POST')throw problem('İşlem yöntemi geçersiz.',405);
 if(action==='command')return service.dispatch(user,id,body);
 if(action==='create-member')return service.createMember(user,id,body);
 if(action==='invite')return service.invite(user,id,String(body?.email || '').trim().toLowerCase());
 if(action==='revoke')return service.revokeInvite(user,id);
 if(action==='remove-member')return service.removeMember(user,id);
 throw problem('Adres bulunamadı.',404);
}
