import test from 'node:test';
import assert from 'node:assert/strict';
import {sharedMainView} from '../server/family/main-view.mjs';
import {sourceItems,calendarDate,cashFlow} from '../src/domain/finance.js';
const date=calendarDate('2026-11-01');
const source={id:1,title:'Selected salary',type:'recurring',amount:120000,startDate:'2025-01-05',dayOfMonth:5,userId:'private-owner',secret:'never send'};
test('main view is a strict scoped whitelist; dependencies and receipts cannot reveal unselected records',()=>{
 const data={banks:[{id:1,name:'Shared bank',secret:'bank secret'},{id:2,name:'Private bank'}],products:[{id:8,bankId:1,type:'card',name:'Selected virtual',cardType:'virtual',parentCardId:9},{id:9,bankId:2,name:'Private parent'}],payments:[{id:4,title:'Selected payment',amount:50,dueDate:'2026-11-02',isPaid:true,productId:9,userId:'owner'},{id:5,title:'Private payment'}],incomeSources:[source,{...source,id:2,title:'Private salary'}],incomeReceipts:[{id:3,incomeId:1,periodYear:2026,periodMonth:10,dueDate:'2026-10-05',actualAmount:115000,isReceived:true,note:'Monthly note',userId:'owner'},{id:4,incomeId:2,note:'Private receipt'}],subscriptionSources:[],statusTracker:{'income:1:2026:10':true,'income:2:2026:10':true,'other-secret':true}};
 const before=JSON.stringify(data),view=sharedMainView(data,['products:8','payments:4','incomeSources:1']);
 assert.equal(JSON.stringify(data),before);assert.equal(view.readOnly,true);assert.equal(view.payments[0].isPaid,true);assert.equal(view.payments[0].productId,null);assert.equal(view.products[0].parentCardId,null);
 assert.equal(view.banks.length,1);assert.equal(view.incomeReceipts.length,1);assert.equal(view.incomeReceipts[0].actualAmount,115000);
 assert.deepEqual(view.statusTracker,{'income:1:2026:10':true});
 for(const secret of ['private-owner','never send','Private parent','Private bank','Private payment','Private salary','Private receipt','other-secret','bank secret'])assert.ok(!JSON.stringify(view).includes(secret));
 assert.equal(view.availableBalance,null);assert.deepEqual(sharedMainView(data,[]).banks,[]);
});
test('shared periods preserve legacy ambiguity before scope filtering, canonical overrides and actual monthly income',()=>{
 const data={incomeSources:[source],expenseSources:[{...source,title:'Private colliding source'}],statusTracker:{'1_10_2026':true}};
 let view=sharedMainView(data,['incomeSources:1']);let row=sourceItems(view.incomeSources,view.statusTracker,date,'income')[0];
 assert.equal(row.isReceived,false);assert.equal(row.hasAmbiguousStatus,true);assert.equal(cashFlow(view,date,7).ambiguous,1);
 data.statusTracker['income:1:2026:11']=true;
 view=sharedMainView(data,['incomeSources:1']);row=sourceItems(view.incomeSources,view.statusTracker,date,'income')[0];assert.equal(row.isReceived,true);assert.equal(row.hasAmbiguousStatus,false);
 delete data.statusTracker['income:1:2026:11'];data.expenseSources=[];
 view=sharedMainView(data,['incomeSources:1']);row=sourceItems(view.incomeSources,view.statusTracker,date,'income')[0];assert.equal(row.isReceived,true);
 data.incomeReceipts=[{id:1,incomeId:1,periodYear:2026,periodMonth:11,actualAmount:140000,expectedAmount:120000,dueDate:'2026-11-05',isReceived:true}];
 view=sharedMainView(data,['incomeSources:1']);row=sourceItems(view.incomeSources,view.statusTracker,date,'income',[],{},view.incomeReceipts)[0];assert.equal(row.amount,140000);assert.equal(row.expectedAmount,120000);
});
test('unshared card reference keeps a selected subscription out of cash payments; archive/exclusion preserved',()=>{
 const data={subscriptionSources:[{...source,id:7,title:'Card subscription',relatedCardId:999}],expenseSources:[{...source,id:8}],statusTracker:{'expense_excluded:8':true,'sub_archived_7':false}};
 const view=sharedMainView(data,['subscriptionSources:7','expenseSources:8']);
 assert.ok(!JSON.stringify(view).includes('999'));assert.equal(cashFlow(view,date,7).expense,0);assert.equal(cashFlow(view,date,7).unlinkedCardSubscriptions,1);assert.equal(cashFlow(view,date,7).cardSubscriptions,1);
 data.statusTracker.sub_archived_7=true;assert.equal(cashFlow(sharedMainView(data,['subscriptionSources:7']),date,7).rows.length,0);
});
