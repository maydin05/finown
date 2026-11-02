import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedHistory} from '../server/family/history.mjs';
const data={payments:[{id:1,title:'Eski taksit',amount:500,dueDate:'2023-01-04',isPaid:true},{id:2,title:'Gizli ödeme',amount:999,dueDate:'2023-01-04',isPaid:false}],incomeSources:[{id:3,title:'Maaş',type:'recurring',amount:120000,startDate:'2023-01-01',endDate:'2023-02-28',dayOfMonth:5,note:'Kaynak notu'}],expenseSources:[],subscriptionSources:[{id:4,title:'Kart aboneliği',amount:200,startDate:'2023-01-01',endDate:'2023-01-31',billingCycle:'monthly',relatedCardId:5}],products:[{id:5,name:'Gizli kart',type:'card',limit:999999}],incomeReceipts:[{id:1,incomeId:3,periodYear:2023,periodMonth:1,dueDate:'2023-01-06',expectedAmount:120000,actualAmount:115000,isReceived:true,note:'Kesinti notu'}],subscriptionPayments:[{subscriptionId:4,periodYear:2023,periodMonth:1,dueDate:'2023-01-01',actualAmount:180,expectedAmount:200,isPaid:true,paidDate:'2023-01-02',note:'Dönem notu'}],statusTracker:{'income:3:2023:2':true}};
test('all history includes old paid/received, actual vs expected and card subscriptions, without private fields',()=>{
 const original=structuredClone(data),r=sharedHistory(data,['payments:1','incomeSources:3','subscriptionSources:4'],'2026-11-02');
 assert.equal(r.rows.find(r=>r.kind==='payment').status,'paid');
 const income=r.rows.find(r=>r.kind==='income' && r.period==='2023-01');assert.equal(income.amount,115000);assert.equal(income.date,'2023-01-06');assert.equal(income.status,'received');
 assert.equal(income.details.find(d=>d.label==='Beklenen tutar').value,120000);assert.equal(income.details.find(d=>d.label==='Dönem notu').value,'Kesinti notu');
 assert.equal(r.rows.find(r=>r.kind==='subscription').amount,180);assert.equal(r.rows.find(r=>r.kind==='income' && r.period==='2023-02').status,'received');
 assert.ok(!JSON.stringify(r).includes('Gizli ödeme'));assert.ok(!JSON.stringify(r).includes('Gizli kart'));assert.ok(!JSON.stringify(r).includes('999999'));assert.deepEqual(data,original);
});
test('period filter, empty sharing, excluded/archived sources remain readable without reactivation',()=>{
 assert.equal(sharedHistory(data,[],'2026-11-02').rows.length,0);
 assert.ok(sharedHistory(data,['incomeSources:3'],'2026-11-02','2023-02').rows.every(r=>r.period==='2023-02'));
 const d={...data,expenseSources:[{id:9,title:'Hariç gider',type:'recurring',amount:100,startDate:'2023-01-01',endDate:'2023-01-31'}],statusTracker:{'expense_excluded:9':true,'sub_archived_4':true}};
 const r=sharedHistory(d,['expenseSources:9','subscriptionSources:4'],'2026-11-02','2023-01');assert.equal(r.rows.find(r=>r.kind==='expense').excluded,true);assert.equal(r.rows.find(r=>r.kind==='subscription').archived,true);
 assert.throws(()=>sharedHistory(data,[],'2026-11-02','nonsense'));
});
test('ambiguous legacy IDs never become received; explicit saved receipt remains authoritative',()=>{
 const d={...data,incomeSources:[{...data.incomeSources[0],id:7}],expenseSources:[{id:7}],incomeReceipts:[],statusTracker:{'7_0_2023':true}};
 assert.equal(sharedHistory(d,['incomeSources:7'],'2026-11-02','2023-01').rows[0].status,'uncertain');
});
test('saved status outside a changed schedule and receipts with incomplete source are retained without inventing dates/amounts',()=>{
 const d={...data,statusTracker:{'income:3:2022:12':true},incomeSources:[{...data.incomeSources[0],startDate:null,date:null}]};
 const r=sharedHistory(d,['incomeSources:3'],'2026-11-02');
 assert.equal(r.rows.find(x=>x.period==='2023-01').amount,115000);
 const old=r.rows.find(x=>x.period==='2022-12');assert.equal(old.status,'received');assert.equal(old.amount,null);assert.equal(old.date,null);
});
