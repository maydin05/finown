import React,{useCallback,useEffect,useRef,useState} from 'react';
import {DataProvider} from './DataContext';
import {DataContext} from './store';
import {familyRequest} from '../family/serverRepository';
import {familyAuth} from '../family/authClient';
import {legacyOwners} from '../domain/finance';

const denyWrite=()=>{throw new Error('Bu ortak görünüm salt okunur. Kayıtları yalnız bütçe sahibi değiştirebilir.');};
const mutations=['saveAvailableBalance','saveIncomeReceipt','addBank','editBank','removeBank','addProduct','editProduct','removeProduct','addPayment','editPayment','removePayment','upsertPayment','addPaymentsBulk','cleanPaymentsForProduct','addSource','updateSource','deleteSource','toggleTracker','saveSubscriptionPayment','markSubscriptionPaid','toggleSubscriptionPaid'];
const guards=Object.fromEntries(mutations.map(name=>[name,denyWrite]));
function SharedDataProvider({id,children}) {
 const [state,setState]=useState({data:null,error:null});
 const active=useRef(true),inFlight=useRef(false);
 const fetchData=useCallback(async()=>{
  if(inFlight.current)return;
  inFlight.current=true;
  try {
   const data=await familyRequest(`/budgets/${id}/main-view`);
   if(active.current)setState({data,error:null});
  }catch{if(active.current)setState({data:null,error:'Ortak verilere erişim doğrulanamadı. Erişimin kaldırılmış veya bağlantı kesilmiş olabilir.'});}
  finally{inFlight.current=false;}
 },[id]);
 useEffect(()=>{
  active.current=true;
  const timer=setInterval(fetchData,5000);
  return()=>{active.current=false;clearInterval(timer);};
 },[fetchData]);
 const data=state.data || {};
 return <DataContext.Provider value={{...data,...guards,readOnly:true,sharedBudgetId:id,trackerOwners:legacyOwners(data),loading:!state.data && !state.error,loadError:state.error,fetchData,resetData:()=>setState({data:null,error:null})}}><React.Fragment key={data.sharedRevision || "loading"}>{children}</React.Fragment></DataContext.Provider>;
}

export default function AccountDataProvider({session,auth,children}) {
 const [access,setAccess]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let active=true;
  familyAuth(auth).then(()=>familyRequest('/budgets')).then(rows=>{
   if(active)setAccess({id:rows.find(b=>b.requester_id===session.user.id && b.owner_id!==session.user.id)?.id || null});
  }).catch(()=>{if(active)setError(true);});
  return()=>{active=false;};
 },[session.user.id,auth,attempt]);
 if(error)return <div className="empty-state" role="alert"><p>Hesap erişimi doğrulanamadı.</p><button className="secondary-button" onClick={()=>{setError(false);setAttempt(n=>n+1);}}>Tekrar dene</button><button className="secondary-button" onClick={()=>auth.signOut()}>Çıkış yap</button></div>;
 if(!access)return <p className="empty-state">Hesap erişimi kontrol ediliyor…</p>;
 return access.id ? <SharedDataProvider key={access.id} id={access.id}>{children}</SharedDataProvider> : <DataProvider>{children}</DataProvider>;
}
