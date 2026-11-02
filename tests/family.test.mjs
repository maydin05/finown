import test from 'node:test';
import assert from 'node:assert/strict';
import { assessFamily, cardDue, familyLedger, rootCard, transitionFamily, familyBasis, cardRemaining } from '../src/family/model.js';
import { demoEnvironment, seededDemo, personalEnvironment } from '../src/family/environment.js';
const env = () => demoEnvironment('2026-11-01');
let sequence = 0;
function send(state, actor, action, payload={}, requestId, environment=env(), operationId) {
  return transitionFamily(state,actor,{action,payload,requestId,version:state.version},environment,{id:operationId || `op-${++sequence}`,at:'2026-11-01T12:00:00.000Z'});
}
function setup(amount=2500,cardId='b') {
  const e=env(); let s=seededDemo('unit',e);
  s=send(s,'requester','create',{title:'Süpürge',amount,date:e.today,category:'Ev'});
  const id=s.requests[0].id;
  s=send(s,'owner','approve',{amount,cardId},id);
  return {s,e,id};
}
test('family: normal onay, tek gerçek harcama, geçmiş ve karşı taraf bildirimi',()=>{
  const {s,e,id}=setup(); const before=structuredClone(s);
  const result=send(s,'requester','purchase',{amount:2500,date:e.today,cardId:'b'},id);
  assert.deepEqual(s,before); assert.equal(result.requests[0].status,'purchased');
  assert.equal(familyLedger(result,e).rows.length,1); assert.equal(familyLedger(result,e).rows[0].amount,2500);
  assert.equal(result.events[1].record.status,'approved');
  assert.ok(result.notifications.some(n=>n.recipient==='owner' && /Gerçek/.test(n.text)===false));
  assert.throws(()=>send(result,'requester','purchase',{amount:2500,date:e.today,cardId:'b'},id));
});
test('family: gerçek tutar onaydan az olsa da değişen koşullar incelenir; tutar gizlenmez',()=>{
  let {s,e,id}=setup(); s=send(s,'requester','purchase',{amount:2000,date:e.today,cardId:'a'},id);
  assert.equal(s.requests[0].status,'review'); assert.equal(familyLedger(s,e).rows[0].amount,2000);
  assert.throws(()=>send(s,'owner','withdraw',{reason:'İptal'},id));
  assert.throws(()=>send(s,'requester','cancel',{reason:'İptal'},id));
  s=send(s,'owner','review',{reason:'Koşullar incelendi'},id);
  assert.equal(s.requests[0].status,'purchased');assert.equal(familyLedger(s,e).rows.length,1);
});
test('family: gelecek gerçek alışveriş ve geçersiz/negatif tutar reddedilir',()=>{
  const {s,id}=setup();
  for(const payload of [{amount:2500,date:'2026-11-02',cardId:'b'},{amount:-2,date:'2026-11-01',cardId:'b'},{amount:2.333,date:'2026-11-01',cardId:'b'},{amount:2500,date:'2026-02-30',cardId:'b'}]) assert.throws(()=>send(s,'requester','purchase',payload,id));
});
test('family: açıklama onayı korur, mali değişim eski koşulları siler, olay geçmişi kalır',()=>{
  let {s,id}=setup();const original=s.events[1].record;
  s=send(s,'requester','edit',{...s.requests[0],note:'Yeni açıklama'},id);assert.equal(s.requests[0].status,'approved');
  s=send(s,'requester','edit',{...s.requests[0],amount:2000},id); assert.equal(s.requests[0].status,'pending');assert.equal(s.requests[0].terms,undefined);assert.deepEqual(s.events[1].record,original);
});
test('family: yetkisiz rol ve yabancı üyelik tüm işlemlerde reddedilir',()=>{
  const {s,e,id}=setup();
  for(const [actor,action,p] of [['outsider','comment',{text:'x'}],['requester','limit',{cardId:'b',amount:999999}],['requester','withdraw',{reason:'x'}],['requester','policy',{buffer:0,confirmCoverage:true}],['owner','purchase',{amount:2500,date:e.today,cardId:'b'}],['owner','edit',{...s.requests[0],amount:10}]]) assert.throws(()=>send(s,actor,action,p,id));
});
test('family: eski sürüm çakışması reddedilir; aynı işlem tekrarı tek olaydır',()=>{
  const {s,e,id}=setup(); const command={action:'comment',requestId:id,payload:{text:'Yorum'},version:s.version};
  const meta={id:'repeat',at:'2026-11-01T13:00:00Z'};
  const next=transitionFamily(s,'requester',command,e,meta);
  assert.equal(transitionFamily(next,'requester',command,e,meta),next);
  assert.throws(()=>transitionFamily(next,'owner',command,e,meta));
  assert.throws(()=>transitionFamily(next,'requester',{...command,payload:{text:'Başka'}},e,{...meta,id:'other'}));
});
test('family: aynı gün gelir eski rezervden önce sayılamaz; sonraki zorunlu ödemeler de korunur',()=>{
  const e=env();e.balance.amount=5000;
  e.summary.rows=[{id:'income',direction:'in',amount:20000,dueDate:e.today},{id:'payment',direction:'out',amount:6000,dueDate:e.today}];
  e.summary.overdueRows=[];
  const s=seededDemo('same-day',e);
  assert.equal(assessFamily(s,e,{amount:1000,date:e.today,cardId:'cash'}).ok,false);
  const e2=env();e2.summary.rows.push({id:'later',direction:'out',amount:100000,dueDate:'2027-01-15'});
  assert.equal(assessFamily(seededDemo('future',e2),e2,{amount:1000,date:e2.today,cardId:'b'}).ok,false);
});
test('family: gecikenler ve güvenlik payı açığa dahil, ana kayıtlar değişmez',()=>{
  const e=env(); e.balance.amount=1000; const before=JSON.stringify(e);
  const s=seededDemo('arrears',e), a=assessFamily(s,e,{amount:100,date:e.today,cardId:'cash'});
  assert.equal(a.ok,false); assert.equal(a.flow.overdueAmount,1000);assert.equal(JSON.stringify(e),before);
});
test('family: eksik bakiye/ekstre ve kapsam değişikliği kesin onayı kapatır',()=>{
  for(const mutate of [e=>{e.balance=null;},e=>{e.balance.fresh=false;},e=>{e.summary.rows.push({id:'unknown',direction:'out',dueDate:e.today,amount:null});},e=>{e.summary.ambiguous=true;}]) {
    const e=env(); const s=seededDemo('missing',e);mutate(e);s.policy.coverage=familyBasis(e);
    assert.equal(assessFamily(s,e,{amount:100,date:e.today,cardId:'cash'}).ok,false);
  }
  const e=env(),s=seededDemo('changed',e);e.summary.rows[0].amount=9000;
  assert.ok(assessFamily(s,e,{amount:100,date:e.today,cardId:'cash'}).reasons.some(r=>r.includes('kapsamı')));
});
test('family: sanal/ana kart rezervleri tek limitte toplanır, sanal ayrı güncel limit de ister',()=>{
  let {s,e}=setup(7000,'v');
  assert.equal(cardRemaining(s,e,'b').amount,23000);assert.equal(cardRemaining(s,e,'v').amount,1000);
  assert.equal(assessFamily(s,e,{amount:2000,date:e.today,cardId:'v'}).ok,false);
  delete s.limits.v; assert.equal(assessFamily(s,e,{amount:100,date:e.today,cardId:'v'}).ok,false);
  assert.equal(rootCard([{id:1,type:'card',parentCardId:2},{id:2,type:'card',parentCardId:1}],1),null);
});
test('family: teklif kabulü bütçe/limiti yeniden kontrol eder, gerekçeli geri çekme rezervi bırakır',()=>{
  const e=env(); let s=seededDemo('offer',e);s=send(s,'requester','create',{title:'Masa',amount:4000,date:e.today});const id=s.requests[0].id;
  s=send(s,'owner','offer',{amount:2000,cardId:'b',reason:'Bütçe'},id);assert.equal(familyLedger(s,e).rows.length,0);
  assert.equal(s.requests[0].offer.cardId,'b');assert.ok(s.requests[0].offer.dueDate);
  s=send(s,'owner','limit',{cardId:'b',amount:1000,items:{}});
  assert.throws(()=>send(s,'requester','accept',{},id));
  assert.throws(()=>send(s,'owner','withdraw',{reason:''},id));
  s=send(s,'owner','withdraw',{reason:'Plan değişti'},id);assert.equal(s.requests[0].status,'pending');assert.equal(s.requests[0].offer,undefined);
});
test('family: nakde yansımış gerçek alışveriş ikinci kez düşmez; yeni bakiye tekrar teyit ister',()=>{
  let {s,e,id}=setup(2500,'cash');s=send(s,'requester','purchase',{amount:2500,date:e.today,cardId:'cash'},id);
  assert.ok(familyLedger(s,e).reasons.length);
  s=send(s,'owner','cash-reflection',{items:{[id]:true}});assert.equal(familyLedger(s,e).rows.length,0);
  const newer=structuredClone(e);newer.balance.token='changed';assert.equal(familyLedger(s,newer).rows.length,1);assert.ok(familyLedger(s,newer).reasons.length);
});
test('family: limite yansıyan kart harcaması ikinci kez düşmez',()=>{
  let {s,e,id}=setup();s=send(s,'requester','purchase',{amount:2500,date:e.today,cardId:'b'},id);
  assert.ok(cardRemaining(s,e,'b').reasons.length);
  s=send(s,'owner','limit',{cardId:'b',amount:27500,items:{[id]:true}});
  assert.equal(cardRemaining(s,e,'b').amount,27500);assert.equal(cardRemaining(s,e,'b').reasons.length,0);
});
test('family: mevcut ekstre eşleştirmesi mükerrer nakit çıkışı yaratmaz; toplu tutar aşımı engellenir',()=>{
  let {s,e,id}=setup();s=send(s,'requester','purchase',{amount:2500,date:e.today,cardId:'b'},id);
  const payment={id:'statement',productId:'b',type:'card',amount:3000,dueDate:s.requests[0].purchase.dueDate,direction:'out'};
  e.statements=[payment]; e.summary.rows.push(payment);
  s=send(s,'owner','statement',{paymentId:'statement',reason:'Ekstrede görüldü'},id,e);
  assert.equal(familyLedger(s,e).rows.length,0);assert.equal(e.summary.rows.filter(r=>r.id==='statement').length,1);
  e.statements[0].amount=1000;assert.equal(familyLedger(s,e).rows.length,1);assert.ok(familyLedger(s,e).reasons.length);
});
test('family: ay sonu kesimi belirsiz, plan dışı ve eksik kart verisi engelli',()=>{
  const cards=[{id:'c',type:'card',cutoffDay:31,paymentDueDay:10}];
  assert.deepEqual(cardDue(cards,'c','2026-02-28'),{date:'2026-04-10',uncertain:true,root:'c'});
  const e=env(),s=seededDemo('horizon',e);assert.equal(assessFamily(s,e,{amount:100,date:'2027-04-01',cardId:'b'}).ok,false);
  assert.equal(cardDue([{id:'c',type:'card'}],'c',e.today).date,null);
});
test('family: yorum/bildirim okunması yalnız ilgili kişide; zararlı link reddedilir',()=>{
  let {s,id}=setup();s=send(s,'owner','comment',{text:'Açıklama'},id);
  const ownerUnread=s.notifications.filter(n=>n.recipient==='owner'&&!n.read).length;
  s=send(s,'requester','read');assert.equal(s.notifications.filter(n=>n.recipient==='requester'&&!n.read).length,0);assert.equal(s.notifications.filter(n=>n.recipient==='owner'&&!n.read).length,ownerUnread);
  assert.throws(()=>send(s,'requester','create',{title:'X',amount:1,date:'2026-11-01',link:'javascript:alert(1)'}));
});
test('family: salt okunur kapsam varsayılan boş; özel kayıtlar değişmez; legacy çakışma kaybolmaz',()=>{
  const data={ incomeSources:[{id:1,type:'recurring',title:'Özel maaş',amount:5000,date:'2026-11-01'}],expenseSources:[{id:1,type:'recurring',title:'Özel gider',amount:2000,date:'2026-11-01'}],statusTracker:{'1_10_2026':true} };
  const before=JSON.stringify(data);
  assert.equal(personalEnvironment(data,[],null,'2026-11-01').summary.rows.length,0);
  const scoped=personalEnvironment(data,['incomeSources:1'],null,'2026-11-01');assert.equal(scoped.summary.ambiguous,true);assert.ok(scoped.summary.rows.some(r=>r.title==='Özel maaş'));assert.ok(!scoped.summary.rows.some(r=>r.title==='Özel gider'));
  assert.equal(JSON.stringify(data),before);
});

test('family: her ayın legacy belirsizliği bağımsız; diğer aydaki typed durum onu kapatmaz',()=>{
  const data={ incomeSources:[{id:1,type:'recurring',title:'Maaş',amount:5000,date:'2026-11-01'}],expenseSources:[{id:1,type:'recurring',amount:1000,date:'2026-11-01'}],statusTracker:{'income:1:2026:11':false,'1_11_2026':true} };
  assert.equal(personalEnvironment(data,['incomeSources:1'],null,'2026-11-01').summary.ambiguous,true);
});
test('family: null güvenlik payı/limit ve sayısal olmayan bakiye kesin onaya dönüşmez',()=>{
  const {s,e}=setup();
  assert.throws(()=>send(s,'owner','policy',{buffer:null,confirmCoverage:true}));
  assert.throws(()=>send(s,'owner','limit',{cardId:'b',amount:null}));
  e.balance.amount=NaN;s.policy.coverage=familyBasis(e);
  assert.equal(assessFamily(s,e,{amount:100,date:e.today,cardId:'cash'}).ok,false);
});

test('family: kart paylaşımı kaldırılınca gerçek harcama kalır; ana kart belirsizliği onayı engeller',()=>{
 let {s,e,id}=setup();s=send(s,'requester','purchase',{amount:2500,date:e.today,cardId:'b'},id);
 e.cards=[];
 assert.equal(familyLedger(s,e).rows[0].amount,2500);
 assert.ok(familyLedger(s,e).reasons.some(r=>r.includes('ana kart')));
 assert.equal(assessFamily(s,e,{amount:100,date:e.today,cardId:'cash'}).ok,false);
});
