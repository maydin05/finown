import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceFlow } from '../src/domain/balanceFlow.js';
import { cashFlow } from '../src/domain/finance.js';
const row=(id,date,amount,direction='out')=>({id,recordType:direction==='in'?'income':'payment',title:'Fixture',dueDate:date,amount,direction});
const summary=()=>({start:'2026-11-01',end:'2026-11-30',rows:[row(1,'2026-11-02',3000),row(2,'2026-11-05',20000,'in'),row(3,'2026-11-10',25000),row(4,'2026-11-20',10000,'in')],overdueRows:[row(5,'2026-10-31',4000)]});
test('positive period total still reveals a later gap, recovery and worst funding requirement without changing records',()=>{
 const s=summary(),before=JSON.stringify(s);s.rows.forEach(Object.freeze);Object.freeze(s.rows);
 const f=balanceFlow(s,5000);assert.deepEqual(f.firstGap,{date:'2026-11-10',amount:3000,conditional:false});assert.equal(f.recoveryDate,'2026-11-20');assert.equal(f.maxGap,3000);assert.equal(f.ending,7000);assert.equal(f.days.length,30);assert.equal(JSON.stringify(s),before);
 const included=balanceFlow(s,5000,true);assert.equal(included.firstGap.date,'2026-11-02');assert.equal(included.firstGap.amount,2000);assert.equal(included.maxGap,7000);assert.equal(included.ending,3000);assert.equal(included.overdue[0].dueDate,'2026-10-31');assert.equal(included.entries.find(r=>r.isOverdue).flowDate,'2026-11-01');assert.equal(JSON.stringify(s),before);
});
test('recorded arrears alone can turn a covered window into a gap; no source arrears are invented',()=>{
 const s={...summary(),rows:[row(1,'2026-11-06',6000),row(2,'2026-11-12',4000),row(3,'2026-11-20',8000,'in')]};
 assert.equal(balanceFlow(s,12000).firstGap,null);const f=balanceFlow(s,12000,true);assert.equal(f.firstGap.date,'2026-11-12');assert.equal(f.maxGap,2000);assert.equal(f.ending,6000);
 const fixture={expenseSources:[{id:9,title:'Recurring',type:'recurring',startDate:'2026-01-01',dayOfMonth:1,amount:100}],payments:[{id:10,amount:20,dueDate:'2026-10-01',isPaid:false},{id:11,amount:50,dueDate:'2026-10-02',isPaid:true}]};const c=cashFlow(fixture,new Date(2026,10,1));assert.equal(c.overdueRows.length,1);assert.equal(balanceFlow(c,100,true).overdueAmount,20);
});
test('same-day income cannot hide an intraday shortfall and cents remain exact',()=>{
 const f=balanceFlow({start:'2026-11-01',end:'2026-11-01',rows:[row(1,'2026-11-01',8000),row(2,'2026-11-01',10000,'in')]},5000);
 assert.equal(f.firstGap.conditional,true);assert.equal(f.maxGap,3000);assert.equal(f.ending,7000);assert.equal(f.recoveryDate,'2026-11-01');
 const fractional=balanceFlow({start:'2026-11-01',end:'2026-11-01',rows:[row(1,'2026-11-01',0.1),row(2,'2026-11-01',0.2)]},0.3);assert.equal(fractional.ending,0);assert.equal(fractional.maxGap,0);
});
test('missing/invalid amounts or ambiguous income never imply guaranteed coverage',()=>{
 for(const amount of [null,undefined,-1,NaN]){const f=balanceFlow({start:'2026-11-01',end:'2026-11-02',rows:[row(1,'2026-11-01',amount)]},100);assert.equal(f.unknownPayments,1);assert.equal(f.uncertain,true);}
 const f=balanceFlow({start:'2026-11-01',end:'2026-11-02',rows:[{...row(1,'2026-11-01',500,'in'),hasAmbiguousStatus:true},row(2,'2026-11-02',100)]},0);assert.equal(f.ending,-100);assert.equal(f.unverified,true);
 assert.equal(balanceFlow(summary(),null).maxGap,null);assert.equal(balanceFlow(summary(),null).ending,null);assert.equal(balanceFlow(summary(),0).firstGap.amount,3000);
});
test('paid/received rows and card-funded subscriptions do not double count; month/year boundaries are calendar based',()=>{
 const rows=[{...row(1,'2027-01-01',100),isPaid:true},{...row(2,'2027-01-01',100,'in'),isReceived:true},row(3,'2027-01-01',50,'card'),row(4,'2027-01-02',30)];
 const f=balanceFlow({start:'2026-12-30',end:'2027-01-03',rows},40);assert.equal(f.days.length,5);assert.equal(f.ending,10);assert.equal(f.entries.length,1);
 const short=balanceFlow({...summary(),end:'2026-11-07'},5000);assert.equal(short.firstGap,null);assert.equal(short.ending,22000);
});
