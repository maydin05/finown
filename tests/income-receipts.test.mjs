import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceItems, cashFlow, legacyOwners } from '../src/domain/finance.js';
import { incomeReceiptInput } from '../src/domain/incomeReceipts.js';
import { balanceBasis } from '../src/domain/availableBalance.js';
const source={id:1,title:'Salary',amount:120000,type:'recurring',startDate:'2026-01-05',dayOfMonth:5};
const nov=new Date(2026,10,1),dec=new Date(2026,11,1);
const owners=legacyOwners({incomeSources:[source]});
const rows=(date,receipts=[],tracker={})=>sourceItems([source],tracker,date,'income',[],owners,receipts);

test('monthly actual receipt changes only its month; adjacent months and source remain planned',()=>{
 const before=JSON.stringify(source);
 const item=rows(nov)[0];const receipt={...incomeReceiptInput(item,'115000','Deduction'),id:8};
 const actual=rows(nov,[receipt])[0];assert.equal(actual.amount,115000);assert.equal(actual.expectedAmount,120000);assert.equal(actual.isReceived,true);assert.equal(actual.dueDate,'2026-11-05');
 assert.equal(rows(dec,[receipt])[0].amount,120000);assert.equal(rows(dec,[receipt])[0].isReceived,false);
 assert.equal(rows(new Date(2026,9,1),[receipt])[0].amount,120000);
 const changed={...receipt,actualAmount:140000};assert.equal(rows(nov,[changed])[0].amount,140000);assert.equal(rows(dec,[changed])[0].amount,120000);
 assert.equal(JSON.stringify(source),before);
});
test('receipt takes precedence over old trackers, undo restores pending amount, unknown historical actual stays unknown',()=>{
 const tracker={'income:1:2026:11':true};const legacy=rows(nov,[],tracker)[0];assert.equal(legacy.actualAmount,null);assert.equal(legacy.isReceived,true);
 const receipt=incomeReceiptInput(legacy,115000,'',false);const restored=rows(nov,[receipt],tracker)[0];assert.equal(restored.amount,120000);assert.equal(restored.isReceived,false);assert.equal(tracker['income:1:2026:11'],true);
 const data={incomeSources:[source],incomeReceipts:[{...receipt,isReceived:true}],statusTracker:tracker};
 assert.equal(cashFlow(data,new Date(2026,10,1)).income,0);
 assert.equal(cashFlow({...data,incomeReceipts:[receipt]},new Date(2026,10,1)).income,120000);
 assert.notEqual(balanceBasis(data),balanceBasis({...data,incomeReceipts:[{...receipt,isReceived:true,actualAmount:140000}]}));
});
test('receipt validation rejects blank, negative and invalid decimal amounts; zero is explicit and valid',()=>{
 const item=rows(nov)[0];for(const amount of ['',null,-1,1.001,NaN,Infinity,1e12])assert.throws(()=>incomeReceiptInput(item,amount));
 assert.equal(incomeReceiptInput(item,'0').actualAmount,0);
 assert.throws(()=>incomeReceiptInput(item,100,'x'.repeat(2001)));
 assert.throws(()=>incomeReceiptInput({...item,id:'virtual'},100));
});
