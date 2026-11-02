import { balanceFlow } from '../domain/balanceFlow.js';
import { calendarDate, dateKey, monthDate } from '../domain/finance.js';

const fail = message => { throw Object.assign(new Error(message), { userMessage: message }); };
const money = value => {
  if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 1e10 || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) > .00001) fail('Pozitif, en fazla iki ondalıklı bir tutar gerekli.');
  return Math.round(Number(value) * 100) / 100;
};
const nonnegative = value => value != null && String(value).trim() !== '' && Number(value) === 0 ? 0 : money(value);
const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && calendarDate(value);
export const purchaseKey = purchase => JSON.stringify(purchase);
export const familyBasis = env => JSON.stringify(env);
export const localToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function newFamily(id) {
  return { id, version: 0, owner: 'owner', requester: 'requester', requests: [], events: [], notifications: [], operations: {}, scope: [], policy: { buffer: 1000, coverage: '' }, limits: {}, cashReflection: {} };
}

export function rootCard(cards, id) {
  let card = cards.find(c => String(c.id) === String(id));
  const seen = new Set();
  while (card?.parentCardId) {
    if (seen.has(String(card.id))) return null;
    seen.add(String(card.id));
    card = cards.find(c => String(c.id) === String(card.parentCardId));
  }
  return card?.type === 'card' && card.cardType !== 'virtual' ? card : null;
}
export function cardDue(cards, id, purchaseDate) {
  if (id === 'cash') return { date: purchaseDate, uncertain: false, root: 'cash' };
  const card = rootCard(cards, id), date = validDay(purchaseDate);
  const cut = Number(card?.cutoffDay), due = Number(card?.paymentDueDay);
  if (!date || !Number.isInteger(cut) || cut < 1 || cut > 31 || !Number.isInteger(due) || due < 1 || due > 31) return { date: null, uncertain: true, root: card?.id };
  const cutoff = monthDate(date.getFullYear(), date.getMonth(), cut);
  const statement = date >= cutoff ? monthDate(date.getFullYear(), date.getMonth() + 1, cut) : cutoff;
  let payment = monthDate(statement.getFullYear(), statement.getMonth(), due);
  if (payment <= statement) payment = monthDate(statement.getFullYear(), statement.getMonth() + 1, due);
  return { date: dateKey(payment), uncertain: dateKey(date) === dateKey(cutoff), root: String(card.id) };
}
const reflected = (map, request) => map?.[request.id]?.key === purchaseKey(request.purchase) ? map[request.id].included : null;
const relevant = state => state.requests.filter(r => r.purchase || r.status === 'approved');
export function familyLedger(state, env, exceptId) {
  const reasons = [], rows = [];
  for (const r of relevant(state).filter(r => r.id !== exceptId)) {
    const t = r.purchase || r.terms;
    if (r.purchase) {
      if (t.cardId === 'cash') {
        const inclusion = state.cashReflection.token === env.balance?.token ? reflected(state.cashReflection.items, r) : null;
        if (inclusion == null) reasons.push(`${r.title}: nakit bakiye yansıması doğrulanmalı.`);
        if (inclusion === true) continue;
      } else {
        const statement = (env.statements || env.summary.rows).find(p => String(p.id) === String(r.statementId) && String(p.productId) === String(rootCard(env.cards, t.cardId)?.id) && p.type === 'card' && p.dueDate === t.dueDate && Number(p.amount) >= t.amount);
        if (r.statementId && !statement) reasons.push(`${r.title}: ekstre eşleştirmesi değişti.`);
        if (statement) continue;
      }
    }
    if (t.cardId !== 'cash' && !rootCard(env.cards,t.cardId)) reasons.push(`${r.title}: ana kart bilgisi doğrulanmalı.`);
    if (!t.dueDate || t.uncertain) reasons.push(`${r.title}: ödeme dönemi belirsiz.`);
    if (t.dueDate > env.end) reasons.push(`${r.title}: ödeme plan ufkunun dışında.`);
    rows.push({ id: `family:${r.id}`, title: r.title, direction: 'out', amount: t.amount, dueDate: t.dueDate < env.today ? env.today : t.dueDate, originalDueDate: t.dueDate, familyRequestId: r.id, actual: !!r.purchase });
  }
  return { rows, reasons };
}
export function cardRemaining(state, env, cardId, exceptId) {
  if (cardId === 'cash') return { amount: null, reasons: [] };
  const root = rootCard(env.cards, cardId), reasons = [];
  if (!root) return { amount: null, reasons: ['Ana kart bağlantısı eksik veya döngülü.'] };
  const snapshot = state.limits[String(root.id)];
  if (!snapshot || snapshot.asOfDate !== env.today) return { amount: null, reasons: ['Bugünkü kullanılabilir kart limiti gerekli. Tanımlı limit kullanılabilir limit değildir.'] };
  let cents = Math.round(snapshot.amount * 100);
  for (const r of relevant(state).filter(r => r.id !== exceptId)) {
    const t = r.purchase || r.terms;
    if (t.cardId === 'cash' || String(rootCard(env.cards, t.cardId)?.id) !== String(root.id)) continue;
    const inclusion = r.purchase ? reflected(snapshot.items, r) : false;
    if (inclusion == null) reasons.push(`${r.title}: kullanılabilir limite yansıması doğrulanmalı.`);
    if (inclusion !== true) cents -= Math.round(t.amount * 100);
  }
  // A virtual card also needs its own current available limit, not its configured ceiling.
  if (String(cardId) !== String(root.id)) {
    const virtual = state.limits[String(cardId)];
    if (!virtual || virtual.asOfDate !== env.today) reasons.push('Sanal kartın bugünkü kullanılabilir limiti gerekli.');
    else {
      let virtualCents = Math.round(virtual.amount * 100);
      for (const r of relevant(state).filter(r => r.id !== exceptId)) {
        const t = r.purchase || r.terms;
        if (String(t.cardId) !== String(cardId)) continue;
        const inclusion = r.purchase ? reflected(virtual.items, r) : false;
        if (inclusion == null) reasons.push(`${r.title}: sanal kart limit yansıması doğrulanmalı.`);
        if (inclusion !== true) virtualCents -= Math.round(t.amount * 100);
      }
      cents = Math.min(cents, virtualCents);
    }
  }
  return { amount: cents / 100, reasons };
}
export function familyPlan(state, env) {
  const ledger = familyLedger(state, env);
  const balance = env.balance?.fresh && env.balance.asOfDate === env.today && Number.isFinite(env.balance.amount) && env.balance.amount >= 0 ? env.balance.amount : null;
  const flow = balanceFlow({ ...env.summary, rows: [...env.summary.rows, ...ledger.rows] }, balance, true);
  const reasons = [...ledger.reasons];
  if (balance == null) reasons.push('Güncel bakiye doğrulanmalı.');
  if (flow.uncertain) reasons.push('Eksik veya belirsiz ödeme bilgileri var.');
  if (state.policy.coverage !== familyBasis(env)) reasons.push('Zorunlu kayıtların kapsamı doğrulanmalı.');
  return { ledger, flow, reasons: [...new Set(reasons)], certain: !reasons.length };
}
export function assessFamily(state, env, proposal, exceptId) {
  const amount = money(proposal.amount), cardId = String(proposal.cardId), date = proposal.date;
  const due = cardDue(env.cards, cardId, date), reasons = [];
  if (!validDay(date) || date < env.today || date > env.end || !due.date || due.date > env.end) reasons.push('Alışveriş ve ödeme günü güncel plan içinde olmalı.');
  if (due.uncertain) reasons.push('Ekstre kesim günündeki ödeme dönemi kesin değil.');
  if (state.policy.coverage !== familyBasis(env)) reasons.push('Ortak bütçeyi etkileyen zorunlu kayıtların kapsamı yeniden doğrulanmalı.');
  if (!env.balance || env.balance.asOfDate !== env.today || !Number.isFinite(env.balance.amount) || env.balance.amount < 0 || !env.balance.fresh) reasons.push('Bugünkü güncel kullanılabilir bakiye gerekli.');
  const ledger = familyLedger(state, env, exceptId);
  reasons.push(...ledger.reasons);
  const limit = cardRemaining(state, env, cardId, exceptId);
  reasons.push(...limit.reasons);
  if (limit.amount != null && Math.round(amount * 100) > Math.round(limit.amount * 100)) reasons.push('Kullanılabilir kart limiti rezervlerden sonra yetersiz.');
  const row = { id: 'candidate', title: 'Yeni talep', direction: 'out', amount, dueDate: due.date };
  const summary = { ...env.summary, rows: [...env.summary.rows, ...ledger.rows, row] };
  const available = env.balance?.fresh && Number.isFinite(env.balance.amount) && env.balance.amount >= 0 ? env.balance.amount : null;
  const flow = balanceFlow(summary, available, true);
  if (flow.uncertain) reasons.push('Eksik ekstre, belirsiz kayıt veya kart bağlantısı var.');
  const minimum = available == null ? null : Math.min(available, ...flow.days.map(day => day.low));
  if (minimum != null && Math.round(minimum * 100) < Math.round(state.policy.buffer * 100)) reasons.push('Ödemeler ve güvenlik payı için yeterli bakiye kalmıyor.');
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)], dueDate: due.date, uncertain: due.uncertain, root: due.root, remainingLimit: limit.amount, minimum, flow, amount, date, cardId };
}
const cleanText = (value, max = 2000) => String(value || '').trim().slice(0, max);
function requestFields(payload) {
  const title = cleanText(payload.title, 100), amount = money(payload.amount), date = payload.date;
  if (!title || !validDay(date)) fail('İhtiyaç adı ve geçerli alışveriş tarihi gerekli.');
  let link = cleanText(payload.link, 1000);
  if (link) { try { const u = new URL(link); if (!['https:', 'http:'].includes(u.protocol)) fail('Ürün bağlantısı http veya https olmalı.'); link = u.href; } catch { fail('Geçerli bir ürün bağlantısı gerekli.'); } }
  return { title, amount, date, category: cleanText(payload.category, 80), priority: cleanText(payload.priority, 80), note: cleanText(payload.note), link };
}

// Pure local state machine. Roles here enforce local interactions, not real identity/access.
// A production adapter MUST repeat authorization and affordability in a trusted transaction.
export function transitionFamily(current, actor, command, env, meta) {
  if (![current.owner, current.requester].includes(actor)) fail('Bu bütçeye erişimin yok.');
  if (!meta?.id || !meta.at) fail('İşlem kimliği ve zamanı gerekli.');
  const operation = JSON.stringify({ actor, command });
  if (current.operations[meta.id]) {
    if (current.operations[meta.id] !== operation) fail('İşlem kimliği başka bir içerikle kullanılmış.');
    return current;
  }
  if (command.version !== current.version) fail('Bütçe başka bir oturumda değişti. Güncelleyip tekrar dene.');
  const state = structuredClone(current), owner = actor === state.owner;
  const r = state.requests.find(x => x.id === command.requestId), p = command.payload || {};
  const requireOwner = () => { if (!owner) fail('Bu işlem bütçe sahibine ait.'); };
  const requireRequester = () => { if (owner || (r && r.createdBy !== actor)) fail('Bu işlem talebi oluşturan kişiye ait.'); };
  const reason = () => { const text = cleanText(p.reason); if (!text) fail('Gerekçe gerekli.'); return text; };
  const beforePurchase = () => { if (!r || r.purchase) fail('Gerçekleşmiş harcama iptal edilerek gizlenemez.'); };
  const notify = (recipient, text, requestId = r?.id) => state.notifications.push({ id: `${meta.id}:notice`, recipient, text, requestId, at: meta.at, read: false });
  let detail = '', targetId = r?.id;
  if (command.action === 'create') {
    requireRequester();
    const fields = requestFields(p);
    if (fields.date < env.today) fail('Yeni talebin tarihi geçmişte olamaz.');
    targetId = meta.id;
    state.requests.push({ ...fields, id: targetId, createdBy: actor, status: 'pending', createdAt: meta.at, createdDate: env.today, version: 0 });
    detail = 'Talep oluşturuldu'; notify(state.owner, `${fields.title}: yeni talep`, targetId);
  } else if (command.action === 'policy') {
    requireOwner(); state.policy.buffer = nonnegative(p.buffer);
    state.policy.coverage = p.confirmCoverage ? familyBasis(env) : '';
    detail = 'Güvenlik payı ve kayıt kapsamı güncellendi';
  } else if (command.action === 'scope') {
    requireOwner(); state.scope = [...new Set(p.keys || [])]; state.policy.coverage = ''; detail = 'Yerel hesaplama için kayıt seçimi değişti';
  } else if (command.action === 'limit') {
    requireOwner();
    if (!env.cards.some(c => String(c.id) === String(p.cardId))) fail('Kart bulunamadı.');
    state.limits[String(p.cardId)] = { amount: nonnegative(p.amount), asOfDate: env.today, items: reflectionItems(state, p.items) };
    detail = 'Kullanılabilir limit ve yansıma bilgisi doğrulandı';
  } else if (command.action === 'cash-reflection') {
    requireOwner(); if (!env.balance?.fresh) fail('Güncel bakiye gerekli.');
    state.cashReflection = { token: env.balance.token, items: reflectionItems(state, p.items) }; detail = 'Nakit harcamaların bakiyeye yansıması doğrulandı';
  } else if (command.action === 'read') {
    state.notifications.forEach(n => { if (n.recipient === actor) n.read = true; }); detail = 'Bildirimler okundu';
  } else {
    if (!r) fail('Talep bulunamadı.');
    switch (command.action) {
      case 'edit': {
        requireRequester(); beforePurchase();
        if (['cancelled', 'rejected'].includes(r.status)) fail('Kapanmış talep düzenlenemez.');
        const fields = requestFields(p);
        const changed = fields.amount !== r.amount || fields.date !== r.date;
        if (changed && fields.date < env.today) fail('Yeni plan tarihi geçmişte olamaz.');
        Object.assign(r, fields);
        if (changed) { r.status = 'pending'; delete r.terms; delete r.offer; }
        detail = changed ? 'Mali alan değişti; yeniden onay gerekli' : 'Açıklama güncellendi; mevcut karar korundu';
        notify(state.owner, `${r.title}: ${detail}`); break;
      }
      case 'approve': case 'offer': case 'accept': {
        beforePurchase();
        const accepting = command.action === 'accept';
        if (accepting) { requireRequester(); if (r.status !== 'offered' || !r.offer) fail('Geçerli teklif yok.'); }
        else { requireOwner(); if (!['pending', 'deferred'].includes(r.status)) fail('Talep onay beklemiyor.'); }
        const proposal = accepting ? r.offer : { amount: p.amount, date: r.date, cardId: p.cardId };
        if (command.action === 'offer' && Number(p.amount) >= r.amount) fail('Önerilen tutar talep tutarından düşük olmalı.');
        if (command.action === 'approve' && Number(p.amount) !== r.amount) fail('Farklı tutar için tutar önerisi gönder.');
        const a = assessFamily(state, env, proposal, r.id);
        if (!a.ok) fail(a.reasons.join(' '));
        if (accepting && a.dueDate !== r.offer.dueDate) fail('Kartın ödeme dönemi değişti; yeni teklif gerekli.');
        const terms = { amount: a.amount, date: a.date, cardId: a.cardId, dueDate: a.dueDate, uncertain: a.uncertain, note: cleanText(accepting ? r.offer.note : p.reason), at: meta.at };
        if (command.action === 'offer') { r.status = 'offered'; r.offer = terms; detail = 'Düşük tutar önerildi'; }
        else { r.status = 'approved'; r.terms = terms; delete r.offer; detail = accepting ? 'Teklif güncel bütçeyle kabul edildi' : 'Tutar ve kart onaylandı'; }
        notify(owner ? state.requester : state.owner, `${r.title}: ${detail}`); break;
      }
      case 'withdraw':
        requireOwner(); beforePurchase(); if (!['approved', 'offered'].includes(r.status)) fail('Geri çekilecek karar yok.');
        detail = `Karar geri çekildi: ${reason()}`; r.status = 'pending'; delete r.terms; delete r.offer; notify(state.requester, `${r.title}: ${detail}`); break;
      case 'reject': case 'defer':
        requireOwner(); beforePurchase(); if (!['pending', 'offered', 'deferred'].includes(r.status)) fail('Önce mevcut kararı geri çek.');
        detail = reason(); r.status = command.action === 'reject' ? 'rejected' : 'deferred'; r.decisionNote = detail; delete r.offer; notify(state.requester, `${r.title}: ${detail}`); break;
      case 'cancel':
        requireRequester(); beforePurchase(); if (['cancelled','rejected'].includes(r.status)) fail('Talep zaten kapalı.');
        detail = `Talep iptal edildi: ${reason()}`; r.status = 'cancelled'; delete r.terms; delete r.offer; notify(state.owner, `${r.title}: ${detail}`); break;
      case 'purchase': {
        requireRequester(); beforePurchase(); if (r.status !== 'approved') fail('Önce onay gerekli.');
        const amount = money(p.amount);
        if (!validDay(p.date) || p.date > env.today || p.date < r.createdDate) fail('Gerçek alışveriş tarihi talep ile bugün arasında olmalı.');
        if (p.cardId !== 'cash' && !env.cards.some(c => String(c.id) === String(p.cardId))) fail('Geçerli kart seç.');
        const due = cardDue(env.cards, String(p.cardId), p.date);
        r.purchase = { amount, date: p.date, cardId: String(p.cardId), dueDate: due.date, uncertain: due.uncertain, capturedAt: meta.at };
        r.status = amount !== r.terms.amount || p.date !== r.terms.date || String(p.cardId) !== r.terms.cardId || due.date !== r.terms.dueDate || due.uncertain ? 'review' : 'purchased';
        detail = 'Rezerv tek gerçek harcamaya dönüştü'; notify(state.owner, `${r.title}: ${detail}${r.status === 'review' ? ', değişen koşulları incele' : ''}`); break;
      }
      case 'review':
        requireOwner(); if (r.status !== 'review' || !r.purchase) fail('İncelenecek gerçek harcama yok.');
        detail = `Gerçek harcama incelendi: ${reason()}`; r.status = 'purchased'; notify(state.requester, `${r.title}: ${detail}`); break;
      case 'statement': {
        requireOwner(); if (!r.purchase || r.purchase.cardId === 'cash') fail('Kart harcaması gerekli.');
        const statement = (env.statements || env.summary.rows).find(x => String(x.id) === String(p.paymentId));
        if (!statement || statement.type !== 'card' || String(statement.productId) !== String(rootCard(env.cards, r.purchase.cardId)?.id) || statement.dueDate !== r.purchase.dueDate || statement.amount == null) fail('Aynı ana kart ve ödeme günündeki tutarı bilinen ekstreyi seç.');
        const total = state.requests.filter(x => x.purchase && x.id !== r.id && String(x.statementId) === String(statement.id)).reduce((s,x)=>s+Math.round(x.purchase.amount*100),Math.round(r.purchase.amount*100));
        if (total > Math.round(statement.amount*100)) fail('Eşleştirilen harcamalar ekstre tutarını aşıyor.');
        reason(); r.statementId = statement.id; detail = 'Gerçek harcamanın mevcut ekstreye dahil olduğu doğrulandı'; break;
      }
      case 'comment': {
        const text = cleanText(p.text); if (!text) fail('Yorum boş olamaz.');
        detail = text; notify(owner ? state.requester : state.owner, `${r.title}: yeni yorum`); break;
      }
      default: fail('Bilinmeyen işlem.');
    }
    r.version += 1;
  }
  state.version += 1;
  state.operations[meta.id] = operation;
  state.events.push({ id: meta.id, actor, action: command.action, requestId: targetId, detail, at: meta.at, version: state.version,
    // Historical terms cannot be changed by subsequent description/financial edits.
    record: targetId ? structuredClone(state.requests.find(x => x.id === targetId)) : undefined });
  return state;
}
function reflectionItems(state, items = {}) {
  const result = {};
  for (const [id, included] of Object.entries(items)) {
    const r = state.requests.find(r => r.id === id);
    if (!r?.purchase || typeof included !== 'boolean') fail('Geçersiz harcama yansıması.');
    result[id] = { key: purchaseKey(r.purchase), included };
  }
  return result;
}
