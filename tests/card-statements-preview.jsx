// DEV-only synthetic amounts, isolated local React state; no Auth, fetch or database writes.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {DataContext} from '../src/context/store';
import {ProductModal} from '../src/modals/ProductModal';
import Expenses from '../src/pages/Expenses';
import Banks from '../src/pages/Banks';
import {CashFlowPanel} from '../src/components/CashFlowSummary';
import {BestCardsModal} from '../src/modals/BestCardsModal';
import {cardProductInput} from '../src/domain/cardStatements';
import '../src/index.css';
const bank={id:9,name:'Ziraat Bankası',color:'from-red-600 to-red-800'};
const original={id:18,bankId:9,type:'card',cardType:'physical',parentCardId:null,name:'Bankkart Gold Troy',last4Digits:'0000',limit:20000,cutoffDay:6,paymentDueDay:16,firstStatementMonth:'2026-11-01'};
const payments=['2026-11-16','2026-12-16','2027-01-16'].map((dueDate,i)=>({id:i+1,productId:18,title:'Bankkart Gold Troy',type:'card',amount:1250+i*100,dueDate,isPaid:i===1}));
export function CardStatementsPreview(){
 const [card,setCard]=useState(original),[draft,setDraft]=useState(null),[screen,setScreen]=useState('payments'),[date,setDate]=useState(new Date(2026,9,1)),[tab,setTab]=useState('pending'),[bestCards,setBestCards]=useState(null);
 const records=new URLSearchParams(location.search).has('prior')?[...payments,{id:4,productId:18,title:'Örnek geçmiş ödeme',type:'card',dueDate:'2026-10-16',amount:500,isPaid:false}]:payments;
 const data={readOnly:true,userId:'synthetic',banks:[bank],products:[card],payments:records,expenseSources:[],incomeSources:[],subscriptionSources:[],subscriptionPayments:[],incomeReceipts:[],statusTracker:{},trackerOwners:{}};
 return <MemoryRouter><DataContext.Provider value={data}><div className="app-shell"><p className="preview-label">Yalnız örnek veriler · Canlı hesaba bağlı değil</p><header className="app-header app-header-compact statement-preview-header"><strong className="wordmark">finown</strong><button className="secondary-button" onClick={()=>setDraft({...card})}>İlk ekstre ayını düzenle</button></header>
 <nav className="line-tabs" aria-label="Önizleme ekranı"><button onClick={()=>setScreen('payments')}>Ödemeler</button><button onClick={()=>setScreen('summary')}>Ekim özeti</button><button onClick={()=>setScreen('banks')}>Bankalar</button></nav>
 <div className="app-content">{screen==='payments'?<Expenses viewDate={date} prevMonth={()=>setDate(new Date(date.getFullYear(),date.getMonth()-1,1))} nextMonth={()=>setDate(new Date(date.getFullYear(),date.getMonth()+1,1))} onThisMonth={()=>setDate(new Date(2026,10,1))} paymentTab={tab} setPaymentTab={setTab}/>:screen==='summary'?<div className="calm-page overview-page"><CashFlowPanel data={data} today={new Date(2026,9,1)}/></div>:<Banks onOpenModal={(type,list)=>{if(type==='best_cards')setBestCards(list);}}/>}</div>
 <output data-testid="card-start" hidden>{card.firstStatementMonth || 'Başlangıç belirtilmedi'}</output><output data-testid="original-payments" hidden>{JSON.stringify(records)}</output>
 {bestCards && <BestCardsModal bestCards={bestCards} banks={[bank]} onClose={()=>setBestCards(null)}/>}
 {draft && <ProductModal editingItem={card} newProduct={draft} setNewProduct={setDraft} banks={[bank]} products={[card]} onClose={()=>setDraft(null)} onSave={()=>{setCard(cardProductInput(draft));setDraft(null);}}/>}
 </div></DataContext.Provider></MemoryRouter>;
}
if(import.meta.env.DEV)createRoot(document.getElementById('root')).render(<CardStatementsPreview/>);
