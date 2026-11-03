// Isolated application component harness: no auth, persistence or live API calls.
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {CashFlowPanel} from '../src/components/CashFlowSummary';
import {Header} from '../src/components/layout/Header';
import {DataContext} from '../src/context/store';
import {balanceBasis,hashBalanceBasis} from '../src/domain/availableBalance';
import '../src/index.css';
const today=new Date(2026,10,3);
const q=new URLSearchParams(location.search);
const fixture={userId:'fixture',payments:[[1,'2026-11-05',10000],[2,'2026-11-09',8000],[3,'2026-11-21',12000],[4,'2026-11-24',106000],[5,'2026-10-31',4000]].map(([id,dueDate,amount])=>({id,dueDate,amount,title:'Örnek ödeme '+id,type:'loan',isPaid:false})),incomeSources:[{id:10,title:'Örnek maaş',type:'one-time',date:'2026-11-20',amount:120000}],expenseSources:[],products:q.has('missing')?[{id:99,type:'card',name:'Eksik örnek ekstre',paymentDueDay:12}]:[],subscriptionSources:[],statusTracker:{},incomeReceipts:[],subscriptionPayments:[],planningFamily:{rows:[],buffer:5000,reasons:q.has('familyError')?['Ortak bütçe rezervleri doğrulanamadı.']:[]},readOnly:q.has('shared')};
if(q.has('familyRemote')) delete fixture.planningFamily;
export function Preview(){const [snapshot,setSnapshot]=useState(null);useEffect(()=>{hashBalanceBasis(balanceBasis(fixture)).then(basisFingerprint=>setSnapshot({amount:25000,asOfDate:q.has('stale')?'2026-11-02':'2026-11-03',capturedAt:'fixture',basisFingerprint}));},[]);const data={...fixture,availableBalance:snapshot,sharedFingerprint:snapshot?.basisFingerprint};return <MemoryRouter><DataContext.Provider value={data}><div className="app-shell"><p className="muted text-xs text-center p-2">Yalnız örnek veriler · Ana uygulama bileşenleri</p><Header onOpenQuickMenu={()=>{}}/><div className="app-content"><div className="calm-page overview-page"><CashFlowPanel data={data} today={today}/></div></div></div></DataContext.Provider></MemoryRouter>}
createRoot(document.getElementById('root')).render(<Preview/>);
