import { dateKey, calendarDate } from './finance.js';

export function validateBalance(amount, asOfDate, today = new Date()) {
  const number = typeof amount === 'string' && !amount.trim() ? NaN : Number(amount);
  if (amount == null || !Number.isFinite(number) || number < 0 || number > 999999999999.99 || Math.abs(number * 100 - Math.round(number * 100)) > 0.00001)
    throw Object.assign(new Error('Invalid balance'), { userMessage: 'Sıfır veya pozitif, en fazla iki ondalıklı bir tutar gir. Boş bakiye sıfır sayılmaz.' });
  if (!calendarDate(asOfDate) || dateKey(asOfDate) > dateKey(today))
    throw Object.assign(new Error('Invalid balance date'), { userMessage: 'Bugün veya öncesi geçerli bir bakiye tarihi seç.' });
  return { amount: Math.round(number * 100) / 100, asOfDate: dateKey(asOfDate) };
}

// Only financial fields affect freshness; display names/notes and array order do not.
export function balanceBasis(data) {
  const fields = {
    payments: ['id','productId','type','amount','dueDate','isPaid'],
    products: ['id','type','cardType','parentCardId','paymentDueDay'],
    incomeSources: ['id','type','amount','date','startDate','endDate','dayOfMonth'],
    expenseSources: ['id','type','amount','date','startDate','endDate','dayOfMonth'],
    subscriptionSources: ['id','type','amount','date','startDate','endDate','dayOfMonth','billingCycle','relatedCardId','isVariable'],
    subscriptionPayments: ['id','subscriptionId','periodYear','periodMonth','expectedAmount','actualAmount','dueDate','paidDate','isPaid'],
  };
  const state = Object.fromEntries(Object.entries(fields).map(([name, keys]) => [name,
    (data[name] || []).map(row => keys.map(key => row[key] ?? null)).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  ]));
  state.trackers = Object.entries(data.statusTracker || {}).sort(([a],[b]) => a.localeCompare(b));
  return JSON.stringify(state);
}
export async function hashBalanceBasis(basis) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(basis));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2,'0')).join('');
}
export function balanceFunding(bridge, snapshot, fingerprint, today = new Date()) {
  let reason = 'missing';
  if (snapshot?.amount != null) {
    try {
      validateBalance(snapshot.amount, snapshot.asOfDate, today);
      reason = snapshot.asOfDate !== dateKey(today) ? 'date' : !fingerprint ? 'checking' : snapshot.basisFingerprint !== fingerprint ? 'records' : !snapshot.capturedAt ? 'date' : 'fresh';
    } catch { reason = 'invalid'; }
  }
  const fresh = reason === 'fresh', amount = fresh ? Number(snapshot.amount) : null;
  const subtract = value => Math.max(0, Math.round(value * 100) - Math.round(amount * 100)) / 100;
  return {
    reason, fresh, amount,
    gap: fresh ? subtract(bridge.amount) : null,
    remaining: fresh ? Math.max(0, Math.round(amount*100)-Math.round(bridge.amount*100))/100 : null,
    sameDayGap: fresh ? subtract(bridge.amount + bridge.sameDayAmount) : null,
    uncertain: bridge.unknown > 0 || bridge.hasUnverifiedData,
  };
}
