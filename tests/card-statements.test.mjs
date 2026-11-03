import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeStatementMonth,cardProductInput,statementMonthAllows} from '../src/domain/cardStatements.js';
import {paymentItemsForMonth,cashFlow} from '../src/domain/finance.js';
import {balanceBasis} from '../src/domain/availableBalance.js';
import {sharedMainView} from '../server/family/main-view.mjs';
import {sharedHistory} from '../server/family/history.mjs';
const card={id:18,bankId:9,type:'card',cardType:'physical',name:'Fixture card',paymentDueDay:16,firstStatementMonth:'2026-11-01'};
const payments=['2026-11-16','2026-12-16','2027-01-16'].map((dueDate,i)=>({id:171+i,productId:18,type:'card',amount:1000+i,dueDate,isPaid:i===0}));
test('first month suppresses earlier placeholders only; November/December/January records, dates and statuses remain identical',()=>{
 const before=JSON.stringify({card,payments});assert.deepEqual(paymentItemsForMonth(payments,[card],new Date(2026,9,1)),[]);
 for(const [year,month,id] of [[2026,10,171],[2026,11,172],[2027,0,173]]){const rows=paymentItemsForMonth(payments,[card],new Date(year,month,1));assert.equal(rows.length,1);const original=payments.find(p=>p.id===id);for(const k of ['id','amount','dueDate','isPaid'])assert.equal(rows[0][k],original[k]);assert.equal(rows[0].isVirtual,undefined);}
 const old={id:170,productId:18,type:'card',dueDate:'2026-10-16',amount:50,isPaid:true};const oldRow=paymentItemsForMonth([...payments,old],[card],new Date(2026,9,1));assert.equal(oldRow.length,1);assert.equal(oldRow[0].isPaid,true);assert.equal(oldRow[0].amount,50);
 assert.equal(paymentItemsForMonth([],[card],new Date(2026,10,1))[0].isVirtual,true);assert.equal(paymentItemsForMonth([],[card],new Date(2027,1,1))[0].dueDate,'2027-02-16');assert.equal(JSON.stringify({card,payments}),before);
});
test('missing boundaries keep legacy behavior, cross-year month comparisons and invalid starts stay uncertain',()=>{
 const old={...card,firstStatementMonth:null};assert.equal(paymentItemsForMonth([],[old],new Date(2025,1,1)).length,1);
 assert.equal(statementMonthAllows(card,2025,10),false);assert.equal(statementMonthAllows(card,2027,0),true);
 for(const start of ['2026-13-01','2026-11-02','2026-',0]){const summary=cashFlow({products:[{...card,firstStatementMonth:start}]},new Date(2026,9,1),30);assert.equal(summary.rows.length,0);assert.equal(summary.incomplete.length,1);}
 assert.equal(cashFlow({products:[card]},new Date(2026,9,1),30).missing.length,0);assert.equal(cashFlow({products:[card]},new Date(2026,10,1),30).missing.length,1);
 assert.equal(paymentItemsForMonth([],[{...card,cardType:'virtual',parentCardId:19}],new Date(2026,11,1)).length,0);
});
test('month normalization, clearing, partial edits and basis invalidation preserve existing balances when unset',()=>{
 assert.equal(normalizeStatementMonth('2026-11'),'2026-11-01');assert.equal(normalizeStatementMonth(null),null);assert.equal(normalizeStatementMonth(''),null);
 for(const bad of ['2026-','-11','2026-00','2026-11-16','1899-12','bad',0])assert.throws(()=>normalizeStatementMonth(bad));
 assert.equal(cardProductInput({...card,cardType:'virtual'}).firstStatementMonth,null);assert.deepEqual(cardProductInput({name:'Rename'}),{name:'Rename'});
 const original=balanceBasis({products:[{...card,firstStatementMonth:undefined}]});assert.equal(original,balanceBasis({products:[{...card,firstStatementMonth:null}]}));assert.equal(original,balanceBasis({products:[{...card,firstStatementMonth:''}]}));assert.notEqual(original,balanceBasis({products:[card]}));assert.notEqual(balanceBasis({products:[card]}),balanceBasis({products:[{...card,firstStatementMonth:'2026-12-01'}]}));
});
test('scoped shared view and read-only history carry selected card start without exposing unselected metadata',()=>{
 const data={products:[card,{...card,id:19,name:'Private card',firstStatementMonth:'2025-01-01'}],payments,banks:[{id:9,name:'Fixture bank'}]};const scope=['products:18',...payments.map(p=>`payments:${p.id}`)];const view=sharedMainView(data,scope);
 assert.equal(view.products[0].firstStatementMonth,'2026-11-01');assert.equal(view.products.length,1);assert.equal(paymentItemsForMonth(view.payments,view.products,new Date(2026,9,1)).length,0);assert.ok(!JSON.stringify(view).includes('Private card'));
 const history=sharedHistory(data,scope,'2026-11-03');assert.ok(history.sources[0].details.some(d=>d.label==='İlk ekstre ayı' && d.value==='Kasım 2026'));assert.equal(history.rows.length,3);
});
