import { balanceFlow } from './balanceFlow.js';
import { calendarDate, dateKey } from './finance.js';
import { familyLedger, familyBasis } from '../family/model.js';

const cents = n => Math.round(Number(n) * 100);
export const incomeChoiceKey = r => `${r.recordType}:${r.id}:${r.dueDate}`;
export function scenarioIncomes(summary) {
  return summary.rows.filter(r => r.direction === 'in' && r.recordType === 'income' && !r.isReceived && !r.hasAmbiguousStatus && r.amount != null && Number.isFinite(Number(r.amount)) && Number(r.amount) >= 0);
}
export function planMoney(value) {
  const n = value == null || String(value).trim() === '' ? NaN : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e10 || Math.abs(n * 100 - cents(n)) > .00001) throw new Error('Sıfır veya pozitif, en fazla iki ondalıklı tutar gir.');
  return cents(n) / 100;
}
export function validateScenario(input, summary) {
  const income = scenarioIncomes(summary).find(r => incomeChoiceKey(r) === input.incomeKey);
  if (!income) throw new Error('Bekleyen bir gelir seç. Alınmış gelirler değiştirilemez.');
  const amount = planMoney(input.amount), extra = planMoney(input.extra), delay = Number(input.delay);
  if (input.delay == null || String(input.delay).trim() === '' || !Number.isInteger(delay) || delay < 0 || delay > 10) throw new Error('Gecikme 0–10 arasında tam gün olmalı.');
  return { incomeKey: input.incomeKey, amount, extra, delay };
}
export function scenarioSummary(summary, input) {
  if (!input) return summary;
  const s = validateScenario(input, summary);
  const rows = summary.rows.map(r => {
    if (incomeChoiceKey(r) !== s.incomeKey || r.direction !== 'in') return r;
    const date = calendarDate(r.dueDate); date.setDate(date.getDate() + s.delay);
    return { ...r, amount: s.amount, dueDate: dateKey(date), scenarioOriginalDate: r.dueDate };
  }).filter(r => r.dueDate >= summary.start && r.dueDate <= summary.end);
  if (s.extra > 0) rows.push({ id: 'scenario:extra', direction: 'out', amount: s.extra, dueDate: summary.start, title: 'Bugün denenen ek harcama', recordType: 'scenario' });
  return { ...summary, rows };
}
// Existing family reflection/statement rules decide whether a purchase is already represented.
// Buffer is shared across the same cash pool: use the largest policy, not one copy per budget.
export function familyProtection(states, today, localEnvironment) {
  const rows = [], reasons = []; let buffer = 0;
  for (const state of states) {
    const env = state?._server?.environment;
    if (!env || env.today !== today) { reasons.push('Ortak bütçe güncel değil.'); continue; }
    try {
      buffer = Math.max(buffer, planMoney(state.policy.buffer));
      if (localEnvironment) {
        const local = localEnvironment(state);
        const fields = ['id','recordType','direction','dueDate','amount','isPaid','isReceived','needsCardAmount','hasAmbiguousStatus','productId','relatedCardId','type','cardType','parentCardId','cutoffDay','paymentDueDay'];
        const financial = rows => (rows || []).map(r=>fields.map(k=>r[k] ?? null)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
        const basis = e => JSON.stringify([financial(e.summary.rows),financial(e.summary.overdueRows),financial(e.cards),financial(e.statements),e.summary.incomplete?.length,e.summary.ambiguous,e.summary.unlinkedCardSubscriptions,e.balance && [e.balance.amount,e.balance.asOfDate,e.balance.fresh]]);
        if (basis(local) !== basis(env)) reasons.push('Ortak bütçenin finansal görünümü değişti. Ana verileri yenile.');
      }
      if (state.policy.coverage !== familyBasis(env)) reasons.push('Ortak bütçe kapsamı doğrulanmalı.');
      const ledger = familyLedger(state, env);
      reasons.push(...ledger.reasons);
      rows.push(...ledger.rows.map(r => ({ ...r, id: `${state.id}:${r.id}` })));
    } catch { reasons.push('Ortak bütçedeki rezervler doğrulanmalı.'); }
  }
  return { rows, buffer, reasons: [...new Set(reasons)] };
}
export function spendingPlan({ summary, available, protection = {rows:[],buffer:0,reasons:[]}, extraBuffer = 0, includeOverdue = false, scenario = null }) {
  const adjusted = scenarioSummary(summary, scenario);
  const combined = { ...adjusted, rows: [...adjusted.rows, ...protection.rows.filter(r => r.dueDate >= summary.start && r.dueDate <= summary.end)] };
  const flow = balanceFlow(combined, available, includeOverdue);
  const buffer = (cents(planMoney(extraBuffer)) + cents(planMoney(protection.buffer))) / 100;
  const fresh = Number.isFinite(available) && available >= 0;
  const minimum = fresh ? Math.min(available, ...flow.days.map(d => d.low)) : null;
  const reasons = [...protection.reasons];
  if (!fresh) reasons.push('Güncel bakiye gerekli.');
  if (flow.uncertain || summary.missing?.length) reasons.push('Eksik ekstre veya belirsiz finans bilgisi var.');
  const eligible = !reasons.length;
  return { flow: { ...flow, uncertain: flow.uncertain || protection.reasons.length > 0, unverified: flow.unverified || protection.reasons.length > 0 }, minimum, buffer, reasons: [...new Set(reasons)], eligible,
    amount: eligible ? Math.max(0,cents(minimum)-cents(buffer))/100 : null,
    reserveGap: fresh ? Math.max(0,cents(buffer)-Math.max(0,cents(minimum)))/100 : null,
    reserved: protection.rows.filter(r => r.dueDate >= summary.start && r.dueDate <= summary.end).reduce((s,r)=>s+cents(r.amount),0)/100 };
}
