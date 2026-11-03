import test from 'node:test';
import assert from 'node:assert/strict';
import {spendingPlan,scenarioSummary,scenarioIncomes,incomeChoiceKey,validateScenario,familyProtection} from '../src/domain/spendingPlan.js';
import {newFamily,familyBasis,purchaseKey} from '../src/family/model.js';
const row=(id,date,amount,direction='out')=>({id,title:'Fixture',recordType:direction==='in'?'income':'payment',dueDate:date,amount,direction});
const summary=()=>({start:'2026-11-03',end:'2026-12-02',rows:[row(1,'2026-11-05',10000),row(2,'2026-11-09',8000),row(3,'2026-11-20',120000,'in'),row(4,'2026-11-21',12000),row(5,'2026-11-24',106000)],overdueRows:[row(6,'2026-10-31',4000)]});
const setup=()=>({summary:summary(),available:25000,protection:{rows:[],buffer:5000,reasons:[]}});
const scenario=(s,updates={})=>({incomeKey:incomeChoiceKey(s.rows[2]),amount:120000,delay:0,extra:0,...updates});
test('minimum before income controls spending, not closing balance; all input records preserved',()=>{
 const args=setup(),before=JSON.stringify(args);args.summary.rows.forEach(Object.freeze);Object.freeze(args.summary.rows);
 const p=spendingPlan(args);assert.equal(p.minimum,7000);assert.equal(p.amount,2000);assert.equal(p.flow.ending,9000);assert.equal(p.buffer,5000);assert.equal(JSON.stringify(args),before);
 assert.equal(spendingPlan({...args,scenario:scenario(args.summary,{amount:140000})}).amount,2000);
});
test('salary cut distinguishes buffer shortfall from payment gap; delayed and extra spending scenarios are ephemeral',()=>{
 const a=setup(),before=JSON.stringify(a),low=spendingPlan({...a,scenario:scenario(a.summary,{amount:115000})});assert.equal(low.amount,0);assert.equal(low.reserveGap,1000);assert.equal(low.flow.maxGap,0);
 const delayed=spendingPlan({...a,scenario:scenario(a.summary,{delay:3})});assert.equal(delayed.flow.maxGap,5000);assert.equal(delayed.flow.firstGap.date,'2026-11-21');
 const extra=spendingPlan({...a,scenario:scenario(a.summary,{extra:10000})});assert.equal(extra.flow.maxGap,3000);assert.equal(extra.flow.firstGap.date,'2026-11-09');assert.equal(JSON.stringify(a),before);
});
test('incomplete data, unavailable balance and unverified family information cannot yield a spendable number',()=>{
 const a=setup();for(const available of [null,undefined,NaN,-1])assert.equal(spendingPlan({...a,available}).amount,null);
 assert.equal(spendingPlan({...a,available:0}).amount,0);
 assert.equal(spendingPlan({...a,summary:{...a.summary,missing:[{}]}}).amount,null);
 assert.equal(spendingPlan({...a,summary:{...a.summary,incomplete:[{}]}}).amount,null);
 assert.equal(spendingPlan({...a,protection:{rows:[],buffer:0,reasons:['Offline']}}).amount,null);
 const unknown={...a.summary,rows:[...a.summary.rows,row(20,'2026-11-06',null)]};assert.equal(spendingPlan({...a,summary:unknown}).amount,null);
});
test('arrears toggle keeps dates; integer cents and same-day order preserved',()=>{
 const a=setup(),before=JSON.stringify(a),p=spendingPlan({...a,includeOverdue:true});assert.equal(p.amount,0);assert.equal(p.reserveGap,2000);assert.equal(JSON.stringify(a),before);
 const s={start:'2026-12-31',end:'2027-01-01',rows:[row(1,'2026-12-31',.1),row(2,'2026-12-31',.2),row(3,'2026-12-31',10,'in')]};const f=spendingPlan({summary:s,available:.3});assert.equal(f.minimum,0);assert.equal(f.amount,0);assert.equal(f.flow.ending,10);
});
test('only selected pending occurrence changes; delayed income outside window is excluded; year boundary works',()=>{
 const s={start:'2026-12-28',end:'2027-01-02',rows:[row(1,'2026-12-31',100,'in'),row(1,'2027-01-01',200,'in'),{...row(3,'2026-12-29',1000,'in'),isReceived:true}]};
 const input={incomeKey:incomeChoiceKey(s.rows[0]),amount:300,delay:2,extra:0},before=JSON.stringify(s);const r=scenarioSummary(s,input);assert.equal(r.rows[0].dueDate,'2027-01-02');assert.equal(r.rows[1].amount,200);assert.equal(JSON.stringify(s),before);assert.equal(scenarioIncomes(s).length,2);
 assert.equal(scenarioSummary(s,{...input,delay:3}).rows.length,2);
 assert.throws(()=>validateScenario({...input,incomeKey:incomeChoiceKey(s.rows[2])},s));
});
test('bad numeric, precision, empty, invalid selection and fractional delay inputs are rejected',()=>{
 const s=summary(),input=scenario(s);for(const value of ['',null,-1,Infinity,.001,10000000001])assert.throws(()=>validateScenario({...input,amount:value},s));
 for(const delay of ['',null,-1,11,1.2])assert.throws(()=>validateScenario({...input,delay},s));assert.throws(()=>validateScenario({...input,incomeKey:'no'},s));assert.equal(validateScenario({...input,amount:0},s).amount,0);
});
test('family reservations use existing cash reflection and statement matching without double subtraction',()=>{
 const state=newFamily('b'),env={today:'2026-11-03',end:'2027-02-01',cards:[{id:1,type:'card'}],summary:{rows:[]},balance:{token:'t'},statements:[{id:99,type:'card',productId:1,dueDate:'2026-11-15',amount:8000}]};state.policy.buffer=3000;state.policy.coverage=familyBasis(env);
 state.requests=[{id:'r',title:'Reserve',status:'approved',terms:{cardId:'cash',dueDate:'2026-11-04',amount:2000}},{id:'c',title:'Cash',purchase:{cardId:'cash',dueDate:'2026-11-03',amount:500}},{id:'s',title:'Matched',statementId:99,purchase:{cardId:'1',dueDate:'2026-11-15',amount:1000}}];
 state.cashReflection={token:'t',items:{c:{key:purchaseKey(state.requests[1].purchase),included:true}}};state._server={environment:env};const before=JSON.stringify(state),p=familyProtection([state],env.today);
 assert.equal(p.buffer,3000);assert.equal(p.rows.length,1);assert.equal(p.rows[0].amount,2000);assert.deepEqual(p.reasons,[]);assert.equal(JSON.stringify(state),before);
 const plan=spendingPlan({...setup(),protection:p});assert.equal(plan.reserved,2000);assert.equal(plan.amount,2000);
 state.cashReflection={};assert(familyProtection([state],env.today).reasons.length>0);state.policy.coverage='stale';assert(familyProtection([state],env.today).reasons.some(x=>x.includes('kapsamı')));
});
test('family snapshot mismatch and stale day block spending; repeated buffer protects the same pool once',()=>{
 const env={today:'2026-11-03',end:'2026-12-02',cards:[],summary:{rows:[],overdueRows:[],incomplete:[]},statements:[],balance:null};
 const a=newFamily('a');a.policy.buffer=1000;a.policy.coverage=familyBasis(env);a._server={environment:env};
 const b={...a,id:'b',policy:{...a.policy,buffer:2000}};
 assert.equal(familyProtection([a,b],env.today).buffer,2000);
 assert(familyProtection([a],'2026-11-04').reasons.length>0);
 assert(familyProtection([a],env.today,()=>({...env,summary:{...env.summary,rows:[row(1,'2026-11-04',10)]}})).reasons.some(r=>r.includes('finansal görünümü')));
});
