import React, { useState } from 'react';
import { spendingPlan, scenarioIncomes, incomeChoiceKey, validateScenario, planMoney } from '../domain/spendingPlan';
import { usePlanningFamily } from '../hooks/usePlanningFamily';
import { formatMoneyTR, formatDateTR } from '../utils';
import { FormModal } from './ui/FormModal';
import { ModalShell } from './ui/Modal';
import BalanceFlowDetails from './BalanceFlowDetails';

const money = n => `₺${formatMoneyTR(n)}`;
function planCopy(plan) {
  if (!plan.eligible) return plan.reasons.join(' ');
  if (plan.flow.firstGap?.conditional) return `Ödemeler gelirden önce çekilirse ${money(plan.flow.maxGap)} gün içi açık gerekebilir.`;
  if (plan.flow.maxGap > 0) return `${formatDateTR(plan.flow.firstGap.date)} itibarıyla açık olabilir. En yüksek açık ${money(plan.flow.maxGap)}.`;
  if (plan.reserveGap > 0) return `Bilinen ödemeler karşılanıyor; korunacak tutarda ${money(plan.reserveGap)} eksik kalıyor.`;
  return `Önümüzdeki 30 günde ${money(plan.buffer)} korunarak bugün harcanabilecek tahmini tutar.`;
}
export default function SpendableCard({data,summary,funding,fingerprint,includeOverdue,balanceControl,onFlow,flowLabel}) {
  const protection = usePlanningFamily(data,fingerprint,summary.start);
  const [scenario,setScenario] = useState(null),[extraBuffer,setExtraBuffer] = useState(0);
  const [modal,setModal] = useState(null),[draft,setDraft] = useState({}),[bufferDraft,setBufferDraft] = useState('0');
  const choices = scenarioIncomes(summary);
  const basePlan = spendingPlan({summary,available:funding.amount,protection,extraBuffer,includeOverdue});
  const plan = spendingPlan({summary,available:funding.amount,protection,extraBuffer,includeOverdue,scenario});
  const openScenario = () => {
    const choice = choices.find(r=>incomeChoiceKey(r)===scenario?.incomeKey) || choices[0];
    setDraft(scenario || {incomeKey:incomeChoiceKey(choice),amount:String(choice.amount),delay:'0',extra:'0'});setModal('scenario');
  };
  const update = (key,value) => setDraft(previous=>({...previous,[key]:value}));
  let draftPlan = null, draftError = '';
  if (modal === 'scenario') {
    try {draftPlan=spendingPlan({summary,available:funding.amount,protection,extraBuffer,includeOverdue,scenario:validateScenario(draft,summary)});}
    catch(e){draftError=e.message;}
  }
  return <>
    <section className={`spendable-card ${scenario?'spendable-scenario':''}`} aria-label="Harcanabilir tutar ve maaş senaryosu">
      <div className="spendable-heading"><strong>Harcanabilir tutar</strong>{balanceControl}</div>
      <div className="spendable-main"><div className={`spendable-figure ${plan.eligible && (plan.flow.maxGap>0 || plan.reserveGap>0)?'negative':''}`} data-testid="spendable-amount" aria-live="polite">{plan.amount==null?'Henüz net değil':money(plan.amount)}</div><button className="scenario-button" disabled={!choices.length} onClick={openScenario}>Maaşı dene →</button></div>
      <p className="spendable-copy" role="status">{!plan.eligible?(!funding.fresh?(data.readOnly && funding.reason==='missing'?'Bakiye paylaşılmadı; hesap netleşmedi.':'Güncel bakiyeyi doğrula.'):summary.missing?.length?'Ekstre tutarı eksik · Önce tamamla.':protection.reasons.length?'Ortak bütçe rezervleri doğrulanmalı.':'Eksik finans bilgilerini kontrol et.'):plan.flow.maxGap>0 || plan.reserveGap>0?planCopy(plan):`30 gün · ${money(plan.buffer)} korunacak tutar`}</p>
      {scenario && <div className="spendable-comparison">Ana plan: {basePlan.amount==null?'Belirsiz':money(basePlan.amount)} harcanabilir · Deneme kaydedilmez.<button className="balance-edit" onClick={()=>setScenario(null)}>Ana plana dön</button></div>}
      <div className="spendable-actions"><button className="balance-edit" onClick={()=>{setBufferDraft(String(extraBuffer));setModal('calculation');}}>Hesabı gör</button><button className="balance-edit spendable-flow" aria-label="Bakiye ve ödeme açığının ayrıntısı" onClick={onFlow}>{scenario ? 'Ana plan · ' : ''}{flowLabel} →</button></div>
      {!choices.length && <small>Bu 30 günde denenecek bekleyen gelir yok.</small>}
    </section>
    {modal === 'calculation' && <FormModal title="Harcanabilir tutarın hesabı" subtitle="30 günlük plan · Yalnız bu ekranda" icon="wallet" tone="income" onClose={()=>setModal(null)} saveLabel="Bu ekranda uygula" onSave={()=>{setExtraBuffer(planMoney(bufferDraft));setModal(null);}}>
      <p className="form-context">{planCopy(plan)}</p><dl className="detail-list"><div><dt>Güncel bakiye</dt><dd>{funding.fresh?money(funding.amount):'Doğrulanmalı'}</dd></div><div><dt>En düşük tahmini bakiye</dt><dd>{plan.minimum==null?'Belirsiz':money(plan.minimum)}</dd></div><div><dt>Ortak bütçe güvenlik payı</dt><dd>{money(protection.buffer)}</dd></div><div><dt>Akışa eklenen ortak rezerv / harcama</dt><dd>{money(plan.reserved)}</dd></div><div><dt>Toplam korunacak tutar</dt><dd>{money(plan.buffer)}</dd></div><div><dt>Bugün harcanabilecek</dt><dd>{plan.amount==null?'Henüz net değil':money(plan.amount)}</dd></div></dl>
      <div className="form-fields"><div><label htmlFor="spend-buffer">Ek güvenlik payı (₺)</label><input id="spend-buffer" type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" value={bufferDraft} onChange={e=>setBufferDraft(e.target.value)}/></div></div>
      <p className="form-context">Bu ek pay yalnız bu ekranda geçerlidir; sayfadan ayrılınca sıfırlanır. Ortak bütçe ayarını değiştirmez. Eşleştirilmiş ekstre ve bakiyeye yansımış harcamalar ikinci kez düşülmez.</p>
      <p className="footnote">En düşük günlük bakiye − ortak güvenlik payı − ek pay. Beklenen gelir bugün eldeki para sayılmaz; aynı gün ödemeler gelirden önce varsayılır. {includeOverdue?'Gecikenler bugün ödenecek varsayıldı.':'Geciken kayıtlar hesap dışında; ana ekrandaki seçenekle dahil edebilirsin.'}</p>
    </FormModal>}
    {modal === 'scenario' && <FormModal title="Maaş ve harcama senaryosu" subtitle="Deneme · Gerçek kayıtlar değişmez" icon="calendar" tone="banks" onClose={()=>setModal(null)} saveLabel="Senaryoyu göster" disabled={!!draftError} onSave={()=>{setScenario(validateScenario(draft,summary));setModal(null);}}>
      <div className="form-fields"><div><label htmlFor="scenario-income">Denenecek bekleyen gelir</label><select id="scenario-income" value={draft.incomeKey} onChange={e=>{const choice=choices.find(r=>incomeChoiceKey(r)===e.target.value);setDraft({incomeKey:e.target.value,amount:String(choice.amount),delay:'0',extra:draft.extra});}}>{choices.map(r=><option key={incomeChoiceKey(r)} value={incomeChoiceKey(r)}>{r.title} · {formatDateTR(r.dueDate)} · {money(r.amount)}</option>)}</select></div>
      <div className="scenario-presets">{[['115000','₺115 bin'],['140000','₺140 bin']].map(([n,label])=><button type="button" key={n} className="secondary-button" onClick={()=>update('amount',n)}>{label}</button>)}<button type="button" className="secondary-button" onClick={()=>update('delay','3')}>3 gün gecikme</button></div>
      <div><label htmlFor="scenario-amount">Deneme maaşı (₺)</label><input id="scenario-amount" type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" value={draft.amount} onChange={e=>update('amount',e.target.value)}/></div>
      <div className="form-grid"><div><label htmlFor="scenario-delay">Gecikme (gün)</label><input id="scenario-delay" type="number" min="0" max="10" step="1" inputMode="numeric" value={draft.delay} onChange={e=>update('delay',e.target.value)}/></div><div><label htmlFor="scenario-extra">Bugün ek harcama (₺)</label><input id="scenario-extra" type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" value={draft.extra} onChange={e=>update('extra',e.target.value)}/></div></div>
      {draftError?<p role="alert">{draftError}</p>:<div className="scenario-result" aria-live="polite"><strong>{draftPlan.amount==null?'Sonuç kesinleşmedi':`${money(draftPlan.amount)} harcanabilir`}</strong><p>{planCopy(draftPlan)}</p><small>Ana plan: {basePlan.amount==null?'Belirsiz':money(basePlan.amount)} · Senaryo son bakiyesi: {draftPlan.flow.ending==null?'Belirsiz':money(draftPlan.flow.ending)}</small></div>}
      <p className="footnote">Yalnız seçtiğin bekleyen gelirin bu ödemesi denenir. Alınmış maaşlar, diğer aylar, tutarlar ve tarihler kaydedilmez. Geciken gelir 30 gün dışına çıkarsa bu dönemi finanse etmez.</p></div>
    </FormModal>}
    {scenario && <button className="scenario-flow-link" onClick={()=>setModal('flow')}>Senaryonun gün gün akışını gör →</button>}
    {modal==='flow' && <ModalShell label="Senaryo bakiye akışı" onClose={()=>setModal(null)}><BalanceFlowDetails summary={summary} flow={plan.flow} funding={funding} prefix="Tahmini " includeOverdue={includeOverdue} onClose={()=>setModal(null)}/></ModalShell>}
  </>;
}
