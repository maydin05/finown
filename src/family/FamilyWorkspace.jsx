import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FormModal } from '../components/ui/FormModal';
import { Icon } from '../components/ui/Icon';
import { assessFamily, cardDue, familyLedger, familyPlan, familyBasis, localToday } from './model';
import { selectableRecords } from './environment';
import './family.css';

const format = value => value == null ? 'Doğrulanmadı' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value);
const statuses = { pending:'Onay bekliyor', offered:'Tutar önerildi', approved:'Onaylandı · rezerv', deferred:'Ertelendi', rejected:'Uygun bulunmadı', cancelled:'İptal edildi', purchased:'Satın alındı', review:'Gerçek harcama · inceleme gerekli' };
const tableLabels = {payments:'Ödeme',incomeSources:'Gelir kaynağı',expenseSources:'Gider kaynağı',subscriptionSources:'Abonelik',products:'Banka ürünü',balance:'Bakiye'};
const names = { owner:'Mehmet', requester:'Talep sahibi' };
const day = date => date ? new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'short' }).format(new Date(`${date}T12:00:00`)) : 'Belirsiz';
const empty = today => ({ title:'', amount:'', date:today, category:'Ev', priority:'Bu ay gerekli', note:'', link:'' });
function Field({ label, children }) {
  const id = useId();
  return <label className="family-field"><span id={id}>{label}</span>{React.cloneElement(children, { 'aria-labelledby': id })}</label>;
}
function Cards({ env, value, onChange, date }) {
  return <Field label="Ödeme yöntemi"><select value={value} onChange={e => onChange(e.target.value)}><option value="cash">Nakit / banka bakiyesi</option>{env.cards.map(c => <option value={c.id} key={c.id}>{c.name} · {day(cardDue(env.cards,c.id,date).date)} tahmini ödeme</option>)}</select></Field>;
}
function RequestFields({ value, onChange }) {
  const set = (key, val) => onChange({ ...value, [key]: val });
  return <div className="family-fields">
    <Field label="İhtiyaç adı"><input value={value.title} maxLength={100} onChange={e=>set('title',e.target.value)} /></Field>
    <div className="family-grid"><Field label="Tahmini tutar (TL)"><input type="number" min="0.01" step="0.01" inputMode="decimal" value={value.amount} onChange={e=>set('amount',e.target.value)} /></Field><Field label="Alışveriş tarihi"><input type="date" value={value.date} onChange={e=>set('date',e.target.value)} /></Field></div>
    <div className="family-grid"><Field label="Kategori"><select value={value.category} onChange={e=>set('category',e.target.value)}>{['Ev','Sağlık','Giyim','Teknoloji','Diğer'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Öncelik"><select value={value.priority} onChange={e=>set('priority',e.target.value)}>{['Bu ay gerekli','Acil','Bekleyebilir'].map(x=><option key={x}>{x}</option>)}</select></Field></div>
    <Field label="Açıklama"><textarea value={value.note} maxLength={2000} onChange={e=>set('note',e.target.value)} /></Field>
    <Field label="Ürün bağlantısı (isteğe bağlı)"><input type="url" value={value.link} onChange={e=>set('link',e.target.value)} placeholder="https://" /></Field>
  </div>;
}
function Assessment({ state, env, proposal, requestId }) {
  let assessment;
  try { assessment = assessFamily(state, env, proposal, requestId); } catch { return <p className="family-muted">Bütçe etkisini görmek için geçerli tutar gir.</p>; }
  return <div className={`family-assessment ${assessment.ok ? 'is-ok' : 'is-warning'}`} role="status">
    <strong>{assessment.ok ? 'Mevcut plana göre karşılanabiliyor' : 'Kesin uygunluk verilemiyor'}</strong>
    <p>{day(assessment.dueDate)} ödeme · En düşük tahmini bakiye {format(assessment.minimum)}</p>
    {assessment.remainingLimit != null && <p>Diğer rezervlerden sonra kullanılabilir limit {format(assessment.remainingLimit)}</p>}
    {!!assessment.reasons.length && <ul>{assessment.reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>}
    <small>Beklenen gelirler tahmindir. Aynı gün gelirden önce ödemeler, gecikenler ve {format(state.policy.buffer)} güvenlik payı hesaba katılır.</small>
  </div>;
}

function PlanSummary({ state, env }) {
  const plan = familyPlan(state, env);
  return <div className="family-card" aria-label="Ortak planın bakiye etkisi"><h3>Rezervler ve gerçek harcamalar sonrası</h3>
    {plan.flow.maxGap == null ? <p>Güncel bakiye olmadan açık hesaplanmadı.</p> : <><p>{plan.flow.firstGap ? `İlk ödeme açığı ${day(plan.flow.firstGap.date)} · ${format(plan.flow.firstGap.amount)}` : 'Bilinen tutarlarla ödeme açığı görünmüyor.'}</p><p>En yüksek ek ihtiyaç {plan.ledger.reasons.length ? '(yansıma varsayımıyla) ' : plan.certain ? '' : 'en az '}{format(plan.flow.maxGap)} · Dönem sonu tahmini {format(plan.flow.ending)}</p></>}
    {!plan.certain && <p className="family-muted">Sonuç kesin değil: {plan.reasons.join(' ')}</p>}
    <small>Güvenlik payı {format(state.policy.buffer)} ayrıca korunur. Beklenen gelirler gerçekleşmeyebilir.</small>
  </div>;
}

export function FamilyWorkspace({ data, mode, onMode, injectedRepository, remoteSession, environmentForState, localOnly=import.meta.env.DEV }) {
  const repo = injectedRepository;
  const [state,setState] = useState(null), [localActor,setActor] = useState('requester');
  const [tab,setTab] = useState('requests'), [selected,setSelected] = useState(null), [modal,setModal] = useState(null), [form,setForm] = useState({});
  const [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const actor = remoteSession?.id || localActor;
  const saving = useRef(false);
  const lastError = useRef('');
  const refresh = async () => { try { setState(await repo.load()); } catch { setError('Bütçe yüklenemedi. Bağlantını kontrol edip tekrar dene.'); } };
  useEffect(()=>{
    let alive = true;
    repo.load().then(s=>{ if (alive) setState(s); }).catch(()=>{ if(alive) setError('Bütçe yüklenemedi. Bağlantını kontrol edip tekrar dene.'); });
    const unsubscribe = repo.subscribe(()=>{ repo.load().then(s=>{ if(alive) setState(s); }).catch(()=>{if(alive && remoteSession){setState(null);setError('Bu bütçeye erişimin sona erdi veya sunucuya ulaşılamıyor.');}}); });
    return ()=>{ alive=false; unsubscribe(); /* StrictMode reuses the memoized adapter; do not close here. */ };
  },[repo,remoteSession]);
  const env = useMemo(()=>state?._server?.environment || environmentForState?.({scope:state?.scope}),[state?._server?.environment,environmentForState,state?.scope]);
  const today = env?.today || localToday();
  const run = async (action,payload={},requestId=selected) => {
    if (saving.current || !state) return;
    saving.current=true; setBusy(true); setError('');
    try {
      const next = await repo.dispatch(actor,{ action,payload,requestId,version:state.version },env);
      setState(next); setModal(null); return true;
    } catch (e) { lastError.current = e.userMessage || e.message || 'İşlem kaydedilemedi.'; setError(lastError.current); await refresh(); return false; }
    finally { saving.current=false;setBusy(false); }
  };
  const open = (type,values={}) => { setError('');setForm(values);setModal(type); };
  const set = (key,value)=>setForm(prev=>({...prev,[key]:value}));
  if (!state) return <section className="family-page"><h1>Aile bütçesi</h1>{!error && <p role="status">Bütçe yükleniyor…</p>}{error && <p role="alert">{error}</p>}</section>;
  const owner = actor === state.owner, r = state.requests.find(x=>x.id===selected);
  const ledger = familyLedger(state,env);
  const unread = state.notifications.filter(n=>n.recipient === actor && !n.read).length;
  const cardsSorted = [...env.cards].sort((a,b)=>(cardDue(env.cards,b.id,form.date || r?.date || today).date || '').localeCompare(cardDue(env.cards,a.id,form.date || r?.date || today).date || ''));
  const afterSave = async (action,payload,requestId) => { if (!await run(action,payload,requestId)) throw Object.assign(new Error('İşlem kaydedilmedi. Ayrıntı sayfada gösteriliyor.'), { userMessage:lastError.current }); };
  let decisionDisabled = false;
  if (modal === 'decision') {
    try { decisionDisabled = !assessFamily(state,env,{...form,date:r.date},r.id).ok; } catch { decisionDisabled = true; }
  }
  const matchingStatements = r?.purchase ? (env.statements || []).filter(p=>p.type === 'card' && p.dueDate === r.purchase.dueDate) : [];
  return <section className="family-page">
    {localOnly && <div className="family-local"><Icon name="flask-conical" size={16}/><span>{remoteSession ? <><strong>Yerel ortak bütçe</strong> · Yetki ve bütçe kontrolü sunucuda. Veriler ayrı test veritabanında; gerçek e-posta gönderilmez.</> : <><strong>Yerel deneme</strong> · Gerçek davet ve ortak hesap erişimi yok. İşlemler yalnız bu tarayıcıdaki ayrı depoya yazılır.</>}</span></div>}
    <header className="family-heading"><div><p>Tek plan, birlikte karar</p><h1>Aile bütçesi</h1></div>{!owner && <button className="primary-button" onClick={()=>open('request',empty(today))}><Icon name="plus" size={16}/>Talep oluştur</button>}</header>
    {remoteSession ? <p className="family-local">Yetkin: {owner ? 'Bütçe sahibi · onay' : 'Talep sahibi'} · Ayrı hesap oturumu</p> : <div className="family-grid family-controls"><Field label="Deneme görünümü"><select value={actor} onChange={e=>{setActor(e.target.value);setSelected(null);setModal(null);setError('');}}><option value="requester">Talep sahibi görünümü</option><option value="owner">Mehmet · onay görünümü</option></select></Field><Field label="Veri kaynağı"><select value={mode} onChange={e=>onMode(e.target.value)}><option value="demo">Yalnız örnek veriler</option><option value="personal">Seçtiğim kayıtlarla salt okunur hesap</option><option value="server">Sunuculu iki hesap testi</option></select></Field></div>}
    {mode === 'personal' && <p className="family-local">Kayıt seçimi paylaşım veya davet değildir. Hiçbir kayıt otomatik seçilmez; kişisel finans kayıtları düzenlenmez.</p>}
    <nav className="family-tabs" aria-label="Aile bütçesi bölümleri">{[['requests','Talepler'],['budget','Ortak plan'],['notifications',`Bildirimler${unread ? ` (${unread})` : ''}`]].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>{setTab(key);setSelected(null);}}>{label}</button>)}</nav>
    {error && <div role="alert" className="family-error">{error}</div>}
    <div aria-busy={busy}>
    {tab === 'requests' && !r && <>
      <div className="family-mini-summary"><span><small>Kullanılabilir bakiye</small><strong>{format(env.balance?.fresh ? env.balance.amount : null)}</strong></span><span><small>Rezerv + açık harcama</small><strong>{format(ledger.rows.reduce((s,x)=>s+x.amount,0))}</strong></span></div>
      <p className="family-muted">Onay ödeme yapmaz; yalnız yerel planda tutar ayırır.</p>
      {!state.requests.length ? <div className="family-empty"><Icon name="shopping-bag" size={32}/><h2>İhtiyaçları birlikte planlayın</h2><p>Talep oluştur; tutar, tarih ve ödeme yöntemi birlikte değerlendirilsin.</p></div> : <ul className="family-request-list">{[...state.requests].reverse().map(req=><li key={req.id}><button onClick={()=>setSelected(req.id)}><span><strong>{req.title}</strong><small>{day(req.date)} · {req.category} · {req.priority}</small><em className={`family-status status-${req.status}`}>{statuses[req.status]}</em></span><b>{format(req.purchase?.amount ?? req.terms?.amount ?? req.offer?.amount ?? req.amount)}</b><Icon name="chevron-right" size={16}/></button></li>)}</ul>}
    </>}
    {tab === 'requests' && r && <article className="family-detail">
      <button className="family-back" onClick={()=>setSelected(null)}>← Talepler</button>
      <div className="family-card"><span className={`family-status status-${r.status}`}>{statuses[r.status]}</span><h2>{r.title}</h2><p className="family-muted">{r.purchase ? 'Gerçek tutar' : 'Talep edilen tutar'}</p><strong className="family-amount">{format(r.purchase?.amount ?? r.amount)}</strong><p>{day(r.date)} · {r.category} · {r.priority}</p>{r.note && <p className="family-copy">{r.note}</p>}{r.link && <a href={r.link} target="_blank" rel="noopener noreferrer">Ürün bağlantısını aç ↗</a>}</div>
      {(r.offer || r.terms) && <div className="family-card family-terms"><h3>{r.offer ? 'Mehmet’in tutar ve ödeme önerisi' : 'Onaylanan koşullar'}</h3><p>{format((r.offer || r.terms).amount)} · {env.cards.find(c=>String(c.id)===(r.offer || r.terms).cardId)?.name || ((r.offer || r.terms).cardId === 'cash' ? 'Nakit / banka bakiyesi' : 'Kart bilgisi paylaşılmıyor')}</p><p>Alışveriş {day((r.offer || r.terms).date)} · Tahmini ödeme {day((r.offer || r.terms).dueDate)}</p><p className="family-copy">{(r.offer || r.terms).note}</p></div>}
      {r.purchase && <div className="family-card"><h3>Gerçek harcama</h3><p>{format(r.purchase.amount)} · {day(r.purchase.date)} · {env.cards.find(c=>String(c.id)===r.purchase.cardId)?.name || (r.purchase.cardId === 'cash' ? 'Nakit' : 'Kart bilgisi paylaşılmıyor')}</p><p>Tahmini ödeme {day(r.purchase.dueDate)}{r.purchase.uncertain ? ' · Kesim günü belirsiz' : ''}</p><p>Eski rezerv yerine bu tutar izlenir. İnceleme beklese de harcama planda kalır.</p>{r.statementId && <p>Mevcut kart ekstresine dahil olarak izleniyor.</p>}</div>}
      {r.purchase && <PlanSummary state={state} env={env}/>}
      {r.decisionNote && <p className="family-card family-copy">{r.decisionNote}</p>}
      {!r.purchase && !['rejected','cancelled'].includes(r.status) && <Assessment state={state} env={env} requestId={r.id} proposal={{ amount:(r.offer || r.terms)?.amount || r.amount, date:(r.offer || r.terms)?.date || r.date, cardId:(r.offer || r.terms)?.cardId || 'cash' }}/>}
      <div className="family-actions">
      {owner && ['pending','deferred'].includes(r.status) && <><button className="primary-button" disabled={busy} onClick={()=>open('decision',{ amount:r.amount,cardId:cardsSorted[0]?.id || 'cash',reason:'',decision:'approve' })}>Tutar ve kart seç</button><button className="secondary-button" onClick={()=>open('reason',{action:'defer',reason:''})}>Ertele</button><button className="secondary-button" onClick={()=>open('reason',{action:'reject',reason:''})}>Uygun bulma</button></>}
      {owner && ['approved','offered'].includes(r.status) && <button className="secondary-button" onClick={()=>open('reason',{action:'withdraw',reason:''})}>Kararı geri çek</button>}
      {!owner && r.status === 'offered' && <button className="primary-button" disabled={busy} onClick={()=>run('accept')}>Teklifi güncel bütçeyle kabul et</button>}
      {!owner && r.status === 'approved' && <button className="primary-button" onClick={()=>open('purchase',{ amount:r.terms.amount,date:today,cardId:r.terms.cardId })}>Satın aldım</button>}
      {!owner && !r.purchase && !['rejected','cancelled'].includes(r.status) && <><button className="secondary-button" onClick={()=>open('request',{...r})}>Talebi düzenle</button><button className="secondary-button" onClick={()=>open('reason',{action:'cancel',reason:''})}>Talebi iptal et</button></>}
      {owner && r.status === 'review' && <button className="primary-button" onClick={()=>open('reason',{action:'review',reason:''})}>Gerçek harcamayı incele</button>}
      {owner && r.purchase?.cardId !== 'cash' && r.purchase && <button className="secondary-button" onClick={()=>open('statement',{paymentId:'',reason:''})}>Mevcut ekstreyle eşleştir</button>}
      </div>
      <div className="family-card"><h3>Yorumlar ve değişiklik geçmişi</h3><button className="secondary-button" onClick={()=>open('comment',{text:''})}>Yorum ekle</button><ol className="family-history">{state.events.filter(e=>e.requestId===r.id).slice().reverse().map(event=><li key={event.id}><strong>{names[event.actor] || (event.actor===state.owner ? 'Bütçe sahibi' : 'Talep sahibi')} · {new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Istanbul'}).format(new Date(event.at))}</strong><p className="family-copy">{event.detail}</p>{event.record?.terms && <small>Karar anında: {format(event.record.terms.amount)} · {day(event.record.terms.dueDate)} ödeme</small>}</li>)}</ol></div>
    </article>}
    {tab === 'budget' && <>
      <div className="family-mini-summary"><span><small>Güncel bakiye</small><strong>{format(env.balance?.fresh ? env.balance.amount : null)}</strong></span><span><small>Korunacak tutar</small><strong>{format(state.policy.buffer)}</strong></span></div>
      {owner && <div className="family-actions"><button className="secondary-button" onClick={()=>open('policy',{buffer:state.policy.buffer,confirmCoverage:state.policy.coverage===familyBasis(env)})}>Bütçe kapsamını doğrula</button><button className="secondary-button" onClick={()=>open('limit',{ cardId:env.cards[0]?.id || '',amount:'',items:{} })}>Kullanılabilir limitleri doğrula</button><button className="secondary-button" onClick={()=>open('cash-reflection',{ items:{} })}>Nakit yansımasını doğrula</button>{mode !== 'demo' && <button className="secondary-button" onClick={()=>open('scope',{keys:[...state.scope]})}>Hesaplamaya katılacak kayıtları seç</button>}</div>}
      <p className="family-muted">{day(env.today)} – {day(env.end)} · Geciken ödemeler bugün ödenecek varsayılır. Beklenen gelir, gerçekleşmiş gelir değildir.</p>
      <PlanSummary state={state} env={env}/>
      {ledger.reasons.map(reason=><p key={reason} className="family-error">{reason}</p>)}
      <ul className="family-plan" aria-label="Ortak bütçe hareketleri">{[...(env.summary.overdueRows || []).map(row=>({...row,dueDate:env.today,title:`Geciken · ${row.title} (vade ${day(row.dueDate)})`})),...env.summary.rows,...ledger.rows].filter(row=>!row.isPaid && !row.isReceived && ['in','out'].includes(row.direction)).sort((a,b)=>(a.dueDate || '').localeCompare(b.dueDate || '') || (a.direction==='out' ? -1:1)).map((row,i)=><li key={`${row.id}:${i}`}><span><strong>{row.title}</strong><small>{day(row.dueDate)} · {row.actual ? 'Gerçek harcama' : row.familyRequestId ? 'Onay rezervi' : row.direction==='in' ? 'Beklenen gelir' : 'Ödeme'}</small></span><b className={row.direction==='in'?'family-income':''}>{row.amount == null ? 'Tutar eksik' : `${row.direction==='in'?'+':'−'} ${format(row.amount)}`}</b></li>)}</ul>
      <div className="family-card"><h3>Limitler ayrı izlenir</h3>{env.cards.map(c=><p key={c.id}>{c.name}: {format(state.limits[c.id]?.asOfDate===today ? state.limits[c.id].amount : null)} <small>{c.parentCardId ? '· Ana kartla ortak limit' : ''}</small></p>)}<p className="family-muted">Kartın banka uygulamasındaki kullanılabilir limiti girilir. Yeni gerçek harcamalarda banka yansıması açıkça doğrulanmadan yeni kesin onay verilmez.</p></div>
    </>}
    {tab === 'notifications' && <div className="family-card"><h2>Bildirimler</h2>{unread>0 && <button className="secondary-button" disabled={busy} onClick={()=>run('read')}>Hepsini okundu işaretle</button>}<ul className="family-notifications">{state.notifications.filter(n=>n.recipient===actor).slice().reverse().map(n=><li key={n.id}><button onClick={()=>{setSelected(n.requestId);setTab('requests');}}>{!n.read && <span aria-label="Okunmamış">● </span>}{n.text}</button></li>)}</ul>{!state.notifications.some(n=>n.recipient===actor) && <p>Henüz bildirim yok.</p>}</div>}
    </div>
    {modal && <FormModal disabled={decisionDisabled} title={{request:form.id?'Talebi düzenle':'Yeni harcama talebi',decision:'Tutar ve ödeme kararı',purchase:'Gerçek alışverişi kaydet',reason:'Gerekçeni paylaş',comment:'Talebe yorum ekle',policy:'Ortak bütçe kapsamı',limit:'Kullanılabilir kart limiti',scope:'Hesaplanacak kayıtları seç','cash-reflection':'Nakit yansımasını doğrula',statement:'Mevcut ekstreyle eşleştir'}[modal]} tone="banks" onClose={()=>setModal(null)} saveLabel={modal==='decision' && form.decision==='offer' ? 'Tutar önerisini gönder' : localOnly ? 'Yerel olarak kaydet' : 'Kaydet'} onSave={async()=>{
      if(modal==='request') return afterSave(form.id?'edit':'create',form,form.id);
      if(modal==='decision') return afterSave(form.decision,form);
      if(modal==='reason') return afterSave(form.action,form);
      return afterSave(modal,form);
    }}>
      {modal==='request' && <><RequestFields value={form} onChange={setForm}/><Assessment state={state} env={env} requestId={form.id} proposal={{ amount:form.amount,date:form.date,cardId:'cash' }}/></>}
      {modal==='decision' && <div className="family-fields"><Field label="Karar"><select value={form.decision} onChange={e=>set('decision',e.target.value)}><option value="approve">Talep tutarını onayla</option><option value="offer">Daha düşük tutar öner</option></select></Field><Field label="Onay / öneri tutarı (TL)"><input type="number" min=".01" step=".01" value={form.amount} onChange={e=>set('amount',e.target.value)}/></Field><Cards env={{...env,cards:cardsSorted}} value={form.cardId} onChange={v=>set('cardId',v)} date={r.date}/><p className="family-muted">Kartlar tahmini son ödeme tarihi en ileri olandan sıralanır; limit ve ödeme günündeki bütçe ayrıca kontrol edilir.</p><Field label="Karar açıklaması"><textarea value={form.reason} onChange={e=>set('reason',e.target.value)}/></Field><Assessment state={state} env={env} requestId={r.id} proposal={{...form,date:r.date}}/></div>}
      {modal==='purchase' && <div className="family-fields"><p>Gerçek tutar, tarih veya kart değişirse inceleme istenir. Harcama yine de planda kalır; ikinci ödeme kaydı oluşturulmaz.</p><Field label="Gerçek tutar (TL)"><input type="number" step=".01" min=".01" value={form.amount} onChange={e=>set('amount',e.target.value)}/></Field><Field label="Gerçek alışveriş tarihi"><input type="date" max={today} value={form.date} onChange={e=>set('date',e.target.value)}/></Field><Cards env={env} value={form.cardId} date={form.date} onChange={v=>set('cardId',v)}/></div>}
      {(modal==='reason' || modal==='statement') && <div className="family-fields">{modal==='statement' && <><p>Yalnız gerçekten ekstreye dahil olan alışverişi eşleştir. Eşleştirme mevcut ekstreyi düzenlemez.</p><Field label="Ekstre"><select value={form.paymentId} onChange={e=>set('paymentId',e.target.value)}><option value="">Ekstre seç</option>{matchingStatements.map(p=><option value={p.id} key={p.id}>{p.title || 'Kart ekstresi'} · {day(p.dueDate)} · {format(p.amount)}</option>)}</select></Field></>}<Field label="Gerekçe"><textarea value={form.reason} onChange={e=>set('reason',e.target.value)}/></Field></div>}
      {modal==='comment' && <Field label="Yorum"><textarea value={form.text} maxLength={2000} onChange={e=>set('text',e.target.value)}/></Field>}
      {modal==='policy' && <div className="family-fields"><Field label="Korunacak güvenlik payı (TL)"><input type="number" min="0" step=".01" value={form.buffer} onChange={e=>set('buffer',e.target.value)}/></Field><label className="family-check"><input type="checkbox" checked={form.confirmCoverage} onChange={e=>set('confirmCoverage',e.target.checked)}/>Bu bütçeyi etkileyen tüm zorunlu kayıtlar plana dahil. Kayıt veya bakiye değişirse yeniden doğrulanacak.</label></div>}
      {modal==='scope' && <div className="family-fields"><p>Seçilen kaynağın dönemlik tutar ve ödeme/alındı bilgileri birlikte kullanılır. Asıl kayıt değişmez.</p>{[...(remoteSession ? state._server.records : selectableRecords(data)),{key:'balance',label:'Güncel kullanılabilir bakiye',table:'balance'}].map(record=><label className="family-check" key={record.key}><input type="checkbox" checked={form.keys.includes(record.key)} onChange={e=>set('keys',e.target.checked ? [...form.keys,record.key] : form.keys.filter(x=>x!==record.key))}/><span>{record.label}<small>{tableLabels[record.table]}</small></span></label>)}</div>}
      {(modal==='limit' || modal==='cash-reflection') && <div className="family-fields">{modal==='limit' && <><Field label="Kart"><select value={form.cardId} onChange={e=>setForm({cardId:e.target.value,amount:'',items:{}})}><option value="">Kart seç</option>{env.cards.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></Field><Field label="Bankadaki bugünkü kullanılabilir limit (TL)"><input type="number" min="0" step=".01" value={form.amount} onChange={e=>set('amount',e.target.value)}/></Field></>}
        <p>Her gerçek harcama için güncel bakiyeye / kullanılabilir limite yansıyıp yansımadığını belirt. Belirsiz seçim yeni kesin onayı engeller.</p>{state.requests.filter(x=>x.purchase && (modal==='cash-reflection' ? x.purchase.cardId==='cash' : x.purchase.cardId!=='cash')).map(req=><Field key={req.id} label={`${req.title} · ${format(req.purchase.amount)}`}><select value={form.items[req.id] == null ? '' : String(form.items[req.id])} onChange={e=>{const items={...form.items}; if(e.target.value==='') delete items[req.id]; else items[req.id]=e.target.value==='true'; set('items',items);}}><option value="">Belirsiz</option><option value="true">Güncel tutara zaten yansımış</option><option value="false">Henüz yansımamış, ayrıca düş</option></select></Field>)}</div>}
    </FormModal>}
  </section>;
}
