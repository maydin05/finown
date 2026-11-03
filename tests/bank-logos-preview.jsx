// All names/amounts here are synthetic fixtures; no Auth, database or write API.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {DataContext} from '../src/context/store';
import Expenses from '../src/pages/Expenses';
import {CashFlowPanel} from '../src/components/CashFlowSummary';
import {Header} from '../src/components/layout/Header';
import '../src/index.css';
const names=['Enpara Bank','Kuveyt Türk','YapıKredi Bank','Ziraat Bankası','Akbank','İşBankası','QNB Bank','Garanti BBVA','ING Bank','Örnek Diğer Banka'];
const banks=names.map((name,i)=>({id:i+1,name}));
const products=banks.map((bank,i)=>({id:i+1,bankId:bank.id,type:i===4?'loan':'card',cardType:'physical',name:i===3?'Bankkart Gold Troy':`Örnek kart ${i+1}`,paymentDueDay:5}));
const payments=products.map((p,i)=>({id:i+1,productId:p.id,title:p.name,type:p.type,amount:1250+i*100,dueDate:'2026-11-05',isPaid:false}));
payments.push({id:11,productId:999,title:'Ziraat adı geçen bağlantısız ödeme',type:'card',amount:50,dueDate:'2026-11-05',isPaid:false});
const data={readOnly:true,userId:'synthetic',banks,products,payments,expenseSources:[],incomeSources:[],subscriptionSources:[],incomeReceipts:[],subscriptionPayments:[],statusTracker:{},trackerOwners:{}};
export function Preview(){
 const [tab,setTab]=useState('pending'),[screen,setScreen]=useState('payments'),[date,setDate]=useState(new Date(2026,10,1));
 return <MemoryRouter><DataContext.Provider value={data}><div className="app-shell"><p className="preview-label">Örnek veriler · Banka logoları tasarım kontrolü</p><Header readOnly/>
 <nav className="line-tabs" aria-label="Önizleme ekranı"><button onClick={()=>setScreen('summary')}>Özet</button><button onClick={()=>setScreen('payments')}>Ödemeler</button></nav>
 <div className="app-content">{screen==='summary'?<div className="calm-page overview-page"><CashFlowPanel data={data} today={new Date(2026,10,3)}/></div>:<Expenses viewDate={date} prevMonth={()=>setDate(new Date(date.getFullYear(),date.getMonth()-1,1))} nextMonth={()=>setDate(new Date(date.getFullYear(),date.getMonth()+1,1))} onThisMonth={()=>setDate(new Date(2026,10,1))} paymentTab={tab} setPaymentTab={setTab}/>}</div></div></DataContext.Provider></MemoryRouter>;
}
if(import.meta.env.DEV)createRoot(document.getElementById('root')).render(<Preview/>);
