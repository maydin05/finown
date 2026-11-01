// Pure calendar/record rules shared by monthly lists and the upcoming cash-flow view.
export function calendarDate(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (typeof value !== 'string' || !value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : calendarDate(date);
}

export function dateKey(value = new Date()) {
    const date = calendarDate(value);
    if (!date || Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function monthDate(year, monthIndex, day) {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(Math.max(Number(day) || 1, 1), lastDay));
}

export function statusKey(type, id, date) {
    return `${type}:${id}:${date.getFullYear()}:${date.getMonth() + 1}`;
}

export function legacyOwners({ incomeSources = [], expenseSources = [], subscriptionSources = [] }) {
    const owners = {};
    for (const [type, sources] of [['income', incomeSources], ['expense', expenseSources], ['subscription', subscriptionSources]]) {
        for (const source of sources) {
            owners[source.id] ??= [];
            if (!owners[source.id].includes(type)) owners[source.id].push(type);
        }
    }
    return owners;
}

export function sourceStatus(type, id, date, tracker, owners = {}) {
    const key = statusKey(type, id, date);
    if (Object.hasOwn(tracker, key)) return { key, done: !!tracker[key], ambiguous: false };
    const legacyKey = `${id}_${date.getMonth()}_${date.getFullYear()}`;
    const hasLegacy = Object.hasOwn(tracker, legacyKey);
    const uniqueOwner = owners[id]?.length === 1 && owners[id][0] === type;
    return { key, done: hasLegacy && uniqueOwner ? !!tracker[legacyKey] : false, ambiguous: hasLegacy && !uniqueOwner };
}

const cycleMonths = { monthly: 1, quarterly: 3, 'semi-annual': 6, annual: 12 };

export function isSourceExcluded(source, type, tracker = {}) {
    return type === 'expense' && !!tracker[`expense_excluded:${source.id}`];
}

export function sourceIssue(source, type) {
    if (type !== 'subscription' && !['recurring', 'one-time'].includes(source.type)) return 'Tekrarlama türü doğrulanmalı';
    const start = source.type === 'one-time' ? source.date : (source.startDate || source.date);
    if (!calendarDate(start)) return 'Başlangıç / ödeme tarihi eksik veya geçersiz';
    if (source.type !== 'one-time' && source.endDate && !calendarDate(source.endDate)) return 'Bitiş tarihi geçersiz';
    if (source.type !== 'one-time' && source.endDate && calendarDate(source.endDate) < calendarDate(start)) return 'Bitiş tarihi başlangıçtan önce';
    if (source.dayOfMonth && (!Number.isInteger(Number(source.dayOfMonth)) || Number(source.dayOfMonth) < 1 || Number(source.dayOfMonth) > 31)) return 'Ödeme günü geçersiz';
    if (type === 'subscription' && source.billingCycle && !cycleMonths[source.billingCycle]) return 'Abonelik dönemi doğrulanmalı';
    if (source.amount == null || !Number.isFinite(Number(source.amount)) || Number(source.amount) < 0) return 'Tutar doğrulanmalı';
    return null;
}

export function sourceItems(sources, tracker, viewDate, type, subscriptionPayments = [], owners = {}, incomeReceipts = []) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const items = [];
    for (const source of sources || []) {
        if (isSourceExcluded(source, type, tracker)) continue;
        if (sourceIssue(source, type)) continue;
        const start = calendarDate(source.type === 'one-time' ? source.date : (source.startDate || source.date));
        const oneTime = source.type === 'one-time';
        const end = !oneTime && source.endDate ? calendarDate(source.endDate) : null;
        const dueDate = oneTime ? start : monthDate(year, month, source.dayOfMonth || start.getDate());
        const monthsSinceStart = (year - start.getFullYear()) * 12 + month - start.getMonth();
        const interval = type === 'subscription' ? (cycleMonths[source.billingCycle] || 1) : 1;
        const scheduled = dueDate.getFullYear() === year && dueDate.getMonth() === month
            && dueDate >= start && (!end || dueDate <= end)
            && (oneTime || (monthsSinceStart >= 0 && monthsSinceStart % interval === 0));
        const payment = type === 'subscription' ? subscriptionPayments.find(p => String(p.subscriptionId) === String(source.id) && Number(p.periodYear) === year && Number(p.periodMonth) === month + 1) : null;
        const receipt = type === 'income' ? incomeReceipts.find(r => String(r.incomeId) === String(source.id) && Number(r.periodYear) === year && Number(r.periodMonth) === month + 1) : null;
        // Preserve recorded history even when it lies outside the current source schedule.
        if (!scheduled && !payment && !receipt) continue;
        const status = sourceStatus(type, source.id, viewDate, tracker || {}, owners);
        const item = {
            ...source, recordType: type, trackerKey: status.key,
            dueDate: dateKey(payment?.dueDate || receipt?.dueDate || dueDate), date: dateKey(payment?.dueDate || receipt?.dueDate || dueDate),
            _originalDate: source.startDate || source.date,
            isPaid: status.done, isReceived: status.done, hasAmbiguousStatus: status.ambiguous,
            isRecurring: !oneTime, subtitle: oneTime ? 'Tek Seferlik' : 'Tekrarlanan', isManual: true,
        };
        if (type === 'income') {
            Object.assign(item, {
                planAmount: source.amount, expectedAmount: receipt?.expectedAmount ?? source.amount, actualAmount: receipt?.actualAmount ?? null,
                receiptNote: receipt?.note ?? '', receiptId: receipt?.id ?? null,
                isReceived: receipt ? receipt.isReceived : status.done,
                hasAmbiguousStatus: receipt ? false : status.ambiguous,
                amount: receipt?.isReceived ? receipt.actualAmount : (receipt?.expectedAmount ?? source.amount),
            });
        }
        if (type === 'subscription') {
            Object.assign(item, {
                paymentId: payment?.id ?? null,
                isPaid: !!payment?.isPaid, isReceived: !!payment?.isPaid, hasAmbiguousStatus: false,
                subtitle: 'Abonelik', expectedAmount: payment?.expectedAmount ?? source.amount,
                actualAmount: payment?.actualAmount ?? null, paidDate: payment?.paidDate ?? null,
                note: payment?.note ?? '',
            });
        }
        items.push(item);
    }
    return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function deletionType(item) {
    if (item.isVirtual) return null;
    return ['payment', 'expense'].includes(item.recordType) ? item.recordType : null;
}

export function isStatementCard(product) {
    return product.type === 'card' && product.cardType !== 'virtual' && !product.parentCardId;
}

export function paymentItemsForMonth(payments = [], products = [], viewDate) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const items = payments.filter(payment => {
        const date = calendarDate(payment.dueDate || payment.date);
        return date?.getFullYear() === year && date?.getMonth() === month;
    }).map(payment => ({ ...payment, recordType: 'payment', dueDate: dateKey(payment.dueDate || payment.date), needsCardAmount: payment.type === 'card' && payment.amount == null }));
    for (const card of products) {
        if (!isStatementCard(card) || !Number.isInteger(Number(card.paymentDueDay)) || card.paymentDueDay < 1 || card.paymentDueDay > 31) continue;
        if (items.some(payment => payment.type === 'card' && String(payment.productId) === String(card.id))) continue;
        items.push({
            id: `virtual_${card.id}`, productId: card.id, title: card.name,
            subtitle: 'Kredi Kartı Ekstresi', recordType: 'payment', type: 'card',
            amount: null, dueDate: dateKey(monthDate(year, month, card.paymentDueDay)),
            isPaid: false, isManual: true, isVirtual: true, needsCardAmount: true,
        });
    }
    return items;
}

export function cashFlow(data, today = new Date(), days = 7) {
    const start = calendarDate(today);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const owners = legacyOwners(data);
    const tracker = data.statusTracker || {};
    const inWindow = item => {
        const date = calendarDate(item.dueDate);
        return date && date >= start && date < end;
    };
    const rows = [];
    // Generate each calendar month touched by the interval, including December -> January.
    for (let month = new Date(start.getFullYear(), start.getMonth(), 1); month < end; month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
        const expenses = sourceItems(data.expenseSources, tracker, month, 'expense', [], owners);
        const incomes = sourceItems(data.incomeSources, tracker, month, 'income', [], owners, data.incomeReceipts);
        const payments = paymentItemsForMonth(data.payments, data.products, month);
        const subscriptions = sourceItems(data.subscriptionSources, tracker, month, 'subscription', data.subscriptionPayments, owners)
            .filter(source => !tracker[`sub_archived_${source.id}`]);
        rows.push(...expenses.map(item => ({ ...item, direction: 'out' })),
            ...payments.map(item => ({ ...item, direction: 'out' })),
            ...incomes.map(item => ({ ...item, direction: 'in' })),
            ...subscriptions.map(item => ({ ...item, direction: item.relatedCardId ? 'card' : 'out', amount: item.expectedAmount ?? item.amount })));
    }
    const upcoming = rows.filter(item => inWindow(item) && !(item.direction === 'in' ? item.isReceived : item.isPaid))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const missing = upcoming.filter(item => item.needsCardAmount);
    const known = item => !item.needsCardAmount && item.amount != null && Number.isFinite(Number(item.amount));
    const income = upcoming.filter(item => item.direction === 'in' && known(item)).reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = upcoming.filter(item => item.direction === 'out' && known(item)).reduce((sum, item) => sum + Number(item.amount), 0);
    const incomplete = [
        ...((data.expenseSources || []).filter(source => !isSourceExcluded(source, 'expense', tracker) && sourceIssue(source, 'expense'))),
        ...((data.incomeSources || []).filter(source => sourceIssue(source, 'income'))),
        ...((data.subscriptionSources || []).filter(source => !tracker[`sub_archived_${source.id}`] && sourceIssue(source, 'subscription'))),
        ...((data.products || []).filter(product => isStatementCard(product) && (!Number.isInteger(Number(product.paymentDueDay)) || product.paymentDueDay < 1 || product.paymentDueDay > 31))),
        ...((data.payments || []).filter(payment => !payment.isPaid && (!calendarDate(payment.dueDate || payment.date) || payment.amount == null))),
    ];
    // Historical unpaid rows are shown separately; do not invent years of recurring arrears.
    const overdue = (data.payments || []).filter(payment => !payment.isPaid && calendarDate(payment.dueDate || payment.date) && calendarDate(payment.dueDate || payment.date) < start);
    const ambiguous = upcoming.filter(item => item.hasAmbiguousStatus).length;
    const unlinkedCardSubscriptions = upcoming.filter(item => {
        if (item.direction !== 'card') return false;
        const card = (data.products || []).find(product => String(product.id) === String(item.relatedCardId));
        return !card || (card.cardType === 'virtual' && !card.parentCardId);
    }).length;
    return { start: dateKey(start), end: dateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)),
        rows: upcoming, income, expense, difference: income - expense, missing, incomplete,
        ambiguous, overdueRows: overdue.map(row => ({ ...row, recordType: 'payment', direction: 'out', dueDate: dateKey(row.dueDate || row.date) })), overdueCount: overdue.length, overdueTotal: overdue.filter(p => p.amount != null && Number.isFinite(Number(p.amount)) && Number(p.amount) >= 0).reduce((sum, item) => sum + Number(item.amount || 0), 0),
        unlinkedCardSubscriptions, cardSubscriptions: upcoming.filter(item => item.direction === 'card').length };
}
