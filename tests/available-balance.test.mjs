import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceBasis, hashBalanceBasis, validateBalance, balanceFunding } from '../src/domain/availableBalance.js';
const today = new Date(2026,10,1);
const fingerprint = 'a'.repeat(64);
const snapshot = amount => ({ amount, asOfDate:'2026-11-01', capturedAt:'2026-11-01T09:00:00Z', basisFingerprint:fingerprint });
const bridge = { amount:3500, sameDayAmount:2000, unknown:0, hasUnverifiedData:false };

test('fresh balance calculates real shortfall, zero, surplus and conditional same-day risk without adding expected income', () => {
  assert.equal(balanceFunding(bridge,snapshot(2000),fingerprint,today).gap,1500);
  assert.equal(balanceFunding(bridge,snapshot(0),fingerprint,today).gap,3500);
  const covered=balanceFunding(bridge,snapshot(5000),fingerprint,today);
  assert.equal(covered.gap,0);assert.equal(covered.remaining,1500);assert.equal(covered.sameDayGap,500);
  const copied=JSON.stringify(bridge);balanceFunding(bridge,snapshot(2000),fingerprint,today);assert.equal(JSON.stringify(bridge),copied);
});
test('missing, empty, old, future and changed-record balances never become fresh zero cash', () => {
  assert.equal(balanceFunding(bridge,null,fingerprint,today).gap,null);
  assert.equal(balanceFunding(bridge,{...snapshot(0),amount:null},fingerprint,today).reason,'missing');
  assert.equal(balanceFunding(bridge,{...snapshot(1),asOfDate:'2026-10-31'},fingerprint,today).reason,'date');
  assert.equal(balanceFunding(bridge,{...snapshot(1),asOfDate:'2026-11-02'},fingerprint,today).reason,'invalid');
  assert.equal(balanceFunding(bridge,snapshot(1),'b'.repeat(64),today).reason,'records');
  assert.equal(balanceFunding(bridge,snapshot(1),null,today).reason,'checking');
  assert.throws(()=>validateBalance('', '2026-11-01',today));
  assert.throws(()=>validateBalance(-1, '2026-11-01',today));
  assert.throws(()=>validateBalance(1.001, '2026-11-01',today));
  assert.throws(()=>validateBalance(1, '2026-02-30',today));
  assert.throws(()=>validateBalance(1, '2026-11-02',today));
  assert.equal(validateBalance('0','2026-11-01',today).amount,0);
});
test('unknown obligations cannot become a confident no-gap result even when known payments fit', () => {
  assert.equal(balanceFunding({...bridge,unknown:1},snapshot(5000),fingerprint,today).uncertain,true);
  assert.equal(balanceFunding({...bridge,hasUnverifiedData:true},snapshot(5000),fingerprint,today).uncertain,true);
  assert.equal(balanceFunding({...bridge,unknown:1},snapshot(2000),fingerprint,today).gap,1500);
});
test('basis ignores display-only edits and ordering but detects paid, received, amount, date and tracker changes', async () => {
  const data={ payments:[{id:2,amount:100,dueDate:'2026-11-02',isPaid:false},{id:1,amount:200}], incomeSources:[{id:3,amount:500,dayOfMonth:5}],statusTracker:{b:false,a:true} };
  const original=balanceBasis(data),hash=await hashBalanceBasis(original);
  assert.match(hash,/^[a-f0-9]{64}$/);
  assert.equal(balanceBasis({...data,payments:[...data.payments].reverse().map(p=>({...p,title:'New name'})),statusTracker:{a:true,b:false}}),original);
  for(const changes of [{isPaid:true},{dueDate:'2026-11-03'},{amount:150}])assert.notEqual(balanceBasis({...data,payments:[{...data.payments[0],...changes},data.payments[1]]}),original);
  assert.notEqual(balanceBasis({...data,statusTracker:{...data.statusTracker,'income:3:2026:11':true}}),original);
  assert.notEqual(balanceBasis({...data,incomeSources:[{...data.incomeSources[0],amount:600}]}),original);
});
