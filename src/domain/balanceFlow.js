import { calendarDate, dateKey } from './finance.js';

const known = row => !row.needsCardAmount && row.amount != null && Number.isFinite(Number(row.amount)) && Number(row.amount) >= 0;
const cents = value => Math.round(Number(value) * 100);

// Read-only simulation. Original dates/statuses stay on each row, including overdue rows.
export function balanceFlow(summary, available, includeOverdue = false) {
  const rows = (summary.rows || []).filter(r => ['in','out'].includes(r.direction) && !(r.direction === 'in' ? r.isReceived : r.isPaid));
  const overdue = includeOverdue ? (summary.overdueRows || []).filter(r => !r.isPaid).map(r => ({ ...r, direction: 'out', isOverdue: true })) : [];
  const entries = [...rows.map(r => ({ ...r, flowDate: r.dueDate })), ...overdue.map(r => ({ ...r, flowDate: summary.start }))]
    .filter(r => calendarDate(r.flowDate) && r.flowDate >= summary.start && r.flowDate <= summary.end);
  const unknownPayments = entries.filter(r => r.direction === 'out' && !known(r)).length;
  const unverified = Boolean(summary.incomplete?.length || summary.ambiguous || summary.unlinkedCardSubscriptions || entries.some(r => r.hasAmbiguousStatus || (r.direction === 'in' && !known(r))));
  const fresh = Number.isFinite(available) && available >= 0;
  let running = fresh ? cents(available) : null, lowest = running, firstGap = null, recoveryDate = null;
  const days = [];
  for (let date = calendarDate(summary.start), end = calendarDate(summary.end); date && end && date <= end; date.setDate(date.getDate()+1)) {
    const key = dateKey(date), events = entries.filter(r => r.flowDate === key);
    const outgoing = events.filter(r => r.direction === 'out' && known(r)).reduce((s,r) => s+cents(r.amount),0);
    // Ambiguous or already received income cannot fund future payments.
    const incoming = events.filter(r => r.direction === 'in' && known(r) && !r.hasAmbiguousStatus).reduce((s,r) => s+cents(r.amount),0);
    const opening = running, low = fresh ? running-outgoing : null, closing = fresh ? low+incoming : null;
    const conditional = fresh && low < 0 && closing >= 0 && incoming > 0;
    if (fresh) {
      if (!firstGap && low < 0) firstGap = { date: key, amount: -low/100, conditional };
      if (firstGap && !recoveryDate && closing >= 0) recoveryDate = key;
      lowest = Math.min(lowest, low); running = closing;
    }
    days.push({ date:key, events, opening: fresh ? opening/100 : null, outgoing:outgoing/100, incoming:incoming/100, low:fresh ? low/100 : null, closing:fresh ? closing/100 : null, conditional, unknown:events.some(r => !known(r)) });
  }
  return { days, entries, firstGap, recoveryDate, unknownPayments, unverified, uncertain:unknownPayments>0 || unverified,
    maxGap:fresh ? Math.max(0,-lowest)/100 : null, ending:fresh ? running/100 : null,
    overdue, overdueAmount:overdue.filter(known).reduce((s,r)=>s+cents(r.amount),0)/100 };
}
