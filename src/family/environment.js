import { cashFlow, calendarDate, dateKey, sourceStatus, legacyOwners } from '../domain/finance.js';
import { localToday, newFamily, familyBasis } from './model.js';

export function plusDays(value, days) { const date = calendarDate(value); date.setDate(date.getDate() + days); return dateKey(date); }
export function demoEnvironment(today = localToday()) {
  const end = plusDays(today, 89);
  const cards = [
    { id: 'a', name: 'Örnek Kart A', type: 'card', cutoffDay: 5, paymentDueDay: 25 },
    { id: 'b', name: 'Örnek Kart B', type: 'card', cutoffDay: 15, paymentDueDay: 10 },
    { id: 'v', name: 'Örnek Sanal Kart', type: 'card', cardType: 'virtual', parentCardId: 'b' },
  ];
  const rows = [
    { id: 'bill', title: 'Örnek zorunlu ödeme', dueDate: plusDays(today, 2), amount: 8000, direction: 'out' },
    { id: 'salary', title: 'Örnek maaş', dueDate: plusDays(today, 4), amount: 25000, direction: 'in' },
    { id: 'rent', title: 'Örnek kira', dueDate: plusDays(today, 8), amount: 15000, direction: 'out' },
    { id: 'salary2', title: 'Örnek gelecek ay maaşı', dueDate: plusDays(today, 34), amount: 25000, direction: 'in' },
  ];
  return { today, end, cards, balance: { amount: 18000, asOfDate: today, token: `demo:${today}`, fresh: true },
    summary: { start: today, end, rows, overdueRows: [{ id: 'overdue', title: 'Örnek geciken ödeme', direction: 'out', amount: 1000, dueDate: plusDays(today, -3) }], incomplete: [] },
    statements: [], sourceBasis: 'synthetic-only' };
}
export function seededDemo(id, env) {
  const state = newFamily(id);
  state.policy.coverage = familyBasis(env);
  state.limits = Object.fromEntries(env.cards.map(c => [c.id, { amount: c.id === 'v' ? 8000 : 30000, asOfDate: env.today, items: {} }]));
  return state;
}
export function selectableRecords(data) {
  return ['payments', 'incomeSources', 'expenseSources', 'subscriptionSources', 'products'].flatMap(table => (data[table] || []).map(r => ({ key: `${table}:${r.id}`, label: r.title || r.name || 'Finansal kayıt', table })));
}
export function personalEnvironment(data, scope, fingerprint, today = localToday()) {
  const keys = new Set(scope), pick = table => (data[table] || []).filter(r => keys.has(`${table}:${r.id}`));
  const scoped = Object.fromEntries(['payments', 'incomeSources', 'expenseSources', 'subscriptionSources', 'products'].map(table => [table, pick(table)]));
  scoped.statusTracker = {};
  // Resolve typed statuses against ALL original source owners before filtering. An unrelated
  // unshared legacy ID collision must not turn an ambiguous status into a paid/received one.
  const owners = legacyOwners(data);
  let ambiguous = false;
  for (const [type, table] of [['income','incomeSources'], ['expense','expenseSources'], ['subscription','subscriptionSources']]) {
    for (const source of scoped[table]) {
      for (const [key, value] of Object.entries(data.statusTracker || {})) {
        if (key.startsWith(`${type}:${source.id}:`) || key === `expense_excluded:${source.id}` || key === `sub_archived_${source.id}`) scoped.statusTracker[key] = value;
      }
      for (let i = 0; i < 4; i++) {
        const date = calendarDate(today); date.setMonth(date.getMonth() + i, 1);
        const status = sourceStatus(type, source.id, date, data.statusTracker || {}, owners);
        if (!status.ambiguous) scoped.statusTracker[status.key] = status.done;
        else ambiguous = true;
      }
    }
  }
  scoped.incomeReceipts = (data.incomeReceipts || []).filter(r => scoped.incomeSources.some(s => String(s.id) === String(r.incomeId)));
  scoped.subscriptionPayments = (data.subscriptionPayments || []).filter(r => scoped.subscriptionSources.some(s => String(s.id) === String(r.subscriptionId)));
  const summary = cashFlow(scoped, calendarDate(today), 90);
  // Ambiguity is resolved per period, never from a typed status in another month.
  summary.ambiguous = Boolean(summary.ambiguous || ambiguous);
  const snapshot = keys.has('balance') ? data.availableBalance : null;
  return { today, end: summary.end, summary, cards: scoped.products.filter(c => c.type === 'card'), statements: scoped.payments,
    balance: snapshot ? { amount: Number(snapshot.amount), asOfDate: snapshot.asOfDate, token: `${snapshot.capturedAt}:${snapshot.basisFingerprint}`, fresh: snapshot.asOfDate === today && !!snapshot.capturedAt && !!fingerprint && snapshot.basisFingerprint === fingerprint } : null,
    // This private comparison string stays in local browser storage; no server/shared account sees it.
    sourceBasis: fingerprint || 'checking', personal: true };
}
