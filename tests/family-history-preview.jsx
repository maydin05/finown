import React from 'react';
import {createRoot} from 'react-dom/client';
import FamilyHistory from '../src/family/FamilyHistory';
import {sharedHistory} from '../server/family/history.mjs';
import '../src/index.css';
import '../src/family/family.css';
const data={payments:[{id:1,title:'Örnek kredi taksiti',amount:7500,dueDate:'2024-01-04',isPaid:true},{id:2,title:'Örnek kart ekstresi',amount:6200,dueDate:'2026-11-09',isPaid:false}],incomeSources:[{id:3,title:'Örnek maaş',type:'recurring',amount:120000,startDate:'2024-01-01',endDate:'2024-02-28',dayOfMonth:5}],incomeReceipts:[{incomeId:3,periodYear:2024,periodMonth:1,dueDate:'2024-01-05',expectedAmount:120000,actualAmount:115000,isReceived:true,note:'Örnek kesinti açıklaması'},{incomeId:3,periodYear:2024,periodMonth:2,dueDate:'2024-02-05',expectedAmount:120000,actualAmount:140000,isReceived:true,note:'Örnek mesai açıklaması'}],expenseSources:[],subscriptionSources:[],products:[],statusTracker:{}};
const repository={loadHistory:async period=>sharedHistory(data,['payments:1','payments:2','incomeSources:3'],'2026-11-02',period)};
if(import.meta.env.DEV)createRoot(document.getElementById('root')).render(<div className="app-shell"><main className="family-page"><p className="family-local">Yalnız örnek veriler · Tasarım kontrolü · Gerçek hesaba bağlantı yok</p><FamilyHistory repository={repository} revision="preview"/></main></div>);
