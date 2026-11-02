import React,{useEffect,useMemo,useState} from 'react';
import { familyRequest,serverFamilyRepository } from './serverRepository';
import { FamilyWorkspace } from './FamilyWorkspace';
import './family.css';
import Login from '../pages/Login';
import MemberAccountForm from './MemberAccountForm';
import {familyAuth} from './authClient';
export default function FamilyServer({onBack,auth:existingAuth}) {
 const localOnly=import.meta.env.DEV;
 const [user,setUser]=useState(null),[ready,setReady]=useState(false),[budgets,setBudgets]=useState([]),[id,setId]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [auth,setAuth]=useState(null),[session,setSession]=useState(null);
 const [memberNotice,setMemberNotice]=useState('');
 const [inviteEmail,setInviteEmail]=useState(''),[inviteLink,setInviteLink]=useState(''),[token,setToken]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get('invite') || '');
 const [settingsOpen,setSettingsOpen]=useState(true);
 const repo=useMemo(()=>id?serverFamilyRepository(id):null,[id]);
 useEffect(()=>{let active=true,subscription;
  familyAuth(existingAuth).then(async client=>{if(!active)return;setAuth(client);subscription=client.onAuthStateChange((_event,value)=>setSession(value)).data.subscription;const result=await client.getSession();if(active){setSession(result.data.session);setReady(true);}}).catch(()=>{if(active){setError('Giriş hizmetine ulaşılamadı.');setReady(true);}});
  return()=>{active=false;subscription?.unsubscribe();};
 },[existingAuth]);
 useEffect(()=>{let active=true;if(!session){setUser(null);setId('');return;}familyRequest('/me').then(value=>{if(active)setUser(value);}).catch(()=>{if(active){setUser(null);setId('');setError('Oturum doğrulanamadı. Yeniden giriş yap.');}});return()=>{active=false;};},[session]);
 useEffect(()=>{if(!user)return;let active=true;familyRequest('/budgets').then(rows=>{if(active)setBudgets(rows);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[user,id]);
 useEffect(()=>{const consume=()=>{const value=new URLSearchParams(window.location.hash.slice(1)).get('invite');if(value){setSettingsOpen(true);setToken(value);window.history.replaceState(null,'',window.location.pathname+window.location.search);}};consume();window.addEventListener('hashchange',consume);return()=>window.removeEventListener('hashchange',consume);},[]);
 const execute=async action=>{if(busy)return;setBusy(true);setError('');try{await action();}catch(e){setError(e.message || 'İşlem tamamlanamadı.');}finally{setBusy(false);}};
 if(!ready)return <p>Oturum kontrol ediliyor…</p>;
 return <>
 <section className={user ? `family-page ${id ? 'family-account-compact' : ''}` : 'family-login-shell'}>
 {localOnly && user && !id && <div className="family-local"><strong>Sunuculu yerel test</strong><span>Supabase Auth · E-posta ve şifre · Kayıt ve şifre sıfırlama kapalı · Üretimden bağımsız.</span></div>}
 {onBack && user && <button className="secondary-button" onClick={onBack}>Yerel denemeye dön</button>}
 {user && !id && <header className="family-heading"><div><h1>Aile bütçesi</h1><p>Ortak bütçeni oluştur; paylaşılacak kayıtları kendin seç.</p></div></header>}
 {user && memberNotice && <p className="family-card" role="status">{memberNotice}</p>}
 {error && <p className="family-error" role="alert">{error}</p>}
 {!user ? auth && <Login auth={auth}/> : <details open={settingsOpen} onToggle={e=>setSettingsOpen(e.currentTarget.open)}><summary>Hesap ve bütçe yönetimi</summary>
 <div className="family-heading"><p>Oturum: <strong>{user.email}</strong></p><button className="secondary-button" disabled={busy} onClick={()=>execute(async()=>{const result=await auth.signOut({scope:'local'});if(result.error)throw result.error;setUser(null);setId('');setBudgets([]);setInviteLink('');})}>{localOnly ? 'Yerel oturumu kapat' : 'Çıkış yap'}</button></div>
 <div className="family-fields">{budgets.length>0 && <label className="family-field">Ortak bütçe<select aria-label="Ortak bütçe" value={id} onChange={e=>{setId(e.target.value);setInviteLink('');}}><option value="">Bütçe seç</option>{budgets.map((b,i)=><option key={b.id} value={b.id}>Ortak bütçe {i+1} · {b.owner_id===user.id?'Bütçe sahibi':'Talep sahibi'}</option>)}</select></label>}
 <button className="secondary-button" disabled={busy} onClick={()=>execute(async()=>{const b=await familyRequest('/budgets',{});setId(b.id);setSettingsOpen(false);})}>Ortak bütçe oluştur</button>
 {user.canCreateMemberAccount && !id && budgets.length===0 && <MemberAccountForm requiresBudget/>}
 <details><summary>Davet bağlantısını kabul et</summary><label className="family-field">Davet kodu<input value={token} onChange={e=>setToken(e.target.value)} autoComplete="off"/></label><button className="primary-button" disabled={busy || !token.trim()} onClick={()=>execute(async()=>{const b=await familyRequest('/accept',{token});setToken('');setId(b.id);setSettingsOpen(false);})}>Bu hesapla daveti kabul et</button></details>
 {id && budgets.some(b=>b.id===id && b.owner_id===user.id) && <details><summary>Üye ve davet yönetimi</summary>{user.canCreateMemberAccount && !budgets.find(b=>b.id===id)?.requester_id && <MemberAccountForm key={id} onCreate={async credentials=>{
 const result=await familyRequest(`/budgets/${id}/create-member`,credentials);
 setBudgets(rows=>rows.map(b=>b.id===id?{...b,requester_id:result.memberId}:b));setInviteLink('');
 setMemberNotice(result.recovered?'Daha önce oluşturulan hesap bütçeye bağlandı. İlk belirlediğin şifre geçerli; yeni yazdığın şifre uygulanmadı.':'Eşinin hesabı oluşturuldu ve ortak bütçeye eklendi. Belirlediğin e-posta ve şifreyle giriş yapabilir; e-posta gönderilmedi.');
 }}/>}<p className="family-muted">Davet edilen kişi seçtiğin ortak kayıtları ve bütçenin talep geçmişini görür. Seçilmemiş kişisel kayıtlar paylaşılmaz.</p><label className="family-field">{localOnly ? 'Davet edilecek yerel hesabın e-postası' : 'Davet edilecek hesabın e-postası'}<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/></label><div className="family-actions"><button className="secondary-button" disabled={busy} onClick={()=>execute(async()=>{const inv=await familyRequest(`/budgets/${id}/invite`,{email:inviteEmail});setInviteLink(`${window.location.origin}${localOnly ? '/tests/family-server-preview.html' : '/family'}#invite=${inv.token}`);})}>{localOnly ? 'Yerel davet bağlantısı oluştur' : 'Davet bağlantısı oluştur'}</button><button className="secondary-button" disabled={busy} onClick={()=>execute(async()=>{await familyRequest(`/budgets/${id}/revoke`,{});setInviteLink('');})}>Bekleyen daveti geri çek</button></div>
 {inviteLink && <label className="family-field">{localOnly ? 'Yerel davet bağlantısı' : 'Davet bağlantısı'}<input readOnly value={inviteLink} onFocus={e=>e.target.select()}/></label>}
 <button className="secondary-button" disabled={busy} onClick={()=>execute(async()=>{await familyRequest(`/budgets/${id}/remove-member`,{});setInviteLink('');})}>{localOnly ? 'İkinci üyenin yerel erişimini kaldır' : 'İkinci üyenin erişimini kaldır'}</button></details>}
 </div></details>}
 {localOnly && !user && <p className="family-auth-note">Yerel Supabase Auth testi · Kayıt ve şifre sıfırlama kapalı.</p>}
 </section>
 {user && repo && <FamilyWorkspace key={`${user.id}:${id}`} id={id} data={{}} mode="server" injectedRepository={repo} remoteSession={user} localOnly={localOnly}/>}
 </>;
}
