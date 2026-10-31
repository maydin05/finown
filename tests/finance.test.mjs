import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDate, dateKey, monthDate, legacyOwners, sourceItems, sourceStatus, sourceIssue, statusKey, deletionType } from '../src/domain/finance.js';

const monthly = { id: 1, title: 'Fixture', type: 'recurring', amount: 100, startDate: '2026-01-31', dayOfMonth: 31 };
const inMonth = (source, year, month, type = 'expense', payments = []) => sourceItems([source], {}, new Date(year, month - 1, 1), type, payments);

test('month-end payments clamp to the month, including leap years', () => {
    assert.equal(dateKey(monthDate(2026, 1, 31)), '2026-02-28');
    assert.equal(dateKey(monthDate(2028, 1, 31)), '2028-02-29');
    assert.equal(inMonth(monthly, 2026, 2)[0].dueDate, '2026-02-28');
    assert.equal(calendarDate('2026-02-31'), null);
});
test('annual, quarterly and semi-annual subscriptions only recur in due periods', () => {
    const annual = { ...monthly, billingCycle: 'annual' };
    assert.equal(inMonth(annual, 2026, 2, 'subscription').length, 0);
    assert.equal(inMonth(annual, 2027, 1, 'subscription').length, 1);
    assert.equal(inMonth({ ...monthly, billingCycle: 'quarterly' }, 2026, 4, 'subscription').length, 1);
    assert.equal(inMonth({ ...monthly, billingCycle: 'quarterly' }, 2026, 3, 'subscription').length, 0);
    assert.equal(inMonth({ ...monthly, billingCycle: 'semi-annual' }, 2026, 7, 'subscription').length, 1);
});
test('one-time subscription does not recur; start and end dates are inclusive', () => {
    const oneTime = { id: 1, amount: 100, type: 'one-time', date: '2026-01-31' };
    assert.equal(inMonth(oneTime, 2026, 1, 'subscription').length, 1);
    assert.equal(inMonth(oneTime, 2026, 2, 'subscription').length, 0);
    assert.equal(inMonth({ ...monthly, endDate: '2026-02-28' }, 2026, 2).length, 1);
    assert.equal(inMonth({ ...monthly, endDate: '2026-02-27' }, 2026, 2).length, 0);
    assert.equal(inMonth(monthly, 2025, 12).length, 0);
});
test('recorded subscription history is preserved outside a revised schedule', () => {
    const rows = inMonth({ ...monthly, billingCycle: 'annual' }, 2026, 2, 'subscription', [
        { id: 12, subscriptionId: 1, periodYear: 2026, periodMonth: 2, dueDate: '2026-02-28', isPaid: true, actualAmount: 75 },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].actualAmount, 75);
    assert.equal(rows[0].isPaid, true);
});
test('existing unambiguous status is read without migrating or modifying trackers', () => {
    const owners = legacyOwners({ expenseSources: [monthly] });
    const tracker = Object.freeze({ '1_1_2026': true });
    assert.equal(sourceStatus('expense', 1, new Date(2026, 1, 1), tracker, owners).done, true);
    assert.equal(sourceStatus('income', 1, new Date(2026, 1, 1), tracker, owners).done, false);
});
test('same-numbered income and expense do not share new status or ambiguous legacy status', () => {
    const owners = legacyOwners({ incomeSources: [monthly], expenseSources: [monthly] });
    const date = new Date(2026, 1, 1);
    const tracker = { [statusKey('expense', 1, date)]: true, '1_1_2026': true };
    assert.equal(sourceStatus('expense', 1, date, tracker, owners).done, true);
    assert.equal(sourceStatus('income', 1, date, tracker, owners).done, false);
    assert.equal(sourceStatus('income', 1, date, tracker, owners).ambiguous, true);
});
test('explicit undo overrides a legacy true value', () => {
    const date = new Date(2026, 1, 1);
    const owners = legacyOwners({ expenseSources: [monthly] });
    assert.equal(sourceStatus('expense', 1, date, { '1_1_2026': true, [statusKey('expense', 1, date)]: false }, owners).done, false);
});
test('invalid expense sources remain unchanged and are not guessed into totals', () => {
    for (const type of ['rent', 'bills', 'market']) {
        const source = Object.freeze({ ...monthly, type });
        assert.ok(sourceIssue(source, 'expense'));
        assert.equal(inMonth(source, 2026, 2).length, 0);
        assert.equal(source.type, type);
    }
    assert.ok(sourceIssue({ ...monthly, startDate: null }, 'expense'));
    assert.ok(sourceIssue({ ...monthly, dayOfMonth: 32 }, 'expense'));
});
test('payment deletion and expense deletion target their own record types; placeholder cannot be deleted', () => {
    assert.equal(deletionType({ id: 7, recordType: 'payment' }), 'payment');
    assert.equal(deletionType({ id: 7, recordType: 'expense' }), 'expense');
    assert.equal(deletionType({ id: 'virtual_7', recordType: 'payment', isVirtual: true }), null);
    assert.equal(deletionType({ id: 7 }), null);
});

test('7-day cash-flow crosses month/year boundary and excludes the eighth day', async () => {
    const { cashFlow } = await import('../src/domain/finance.js');
    const summary = cashFlow({ payments: [
        { id: 1, title: 'Last day', dueDate: '2026-12-31', amount: 30, isPaid: false },
        { id: 2, title: 'Next year', dueDate: '2027-01-06', amount: 70, isPaid: false },
        { id: 3, title: 'Eighth day', dueDate: '2027-01-07', amount: 500, isPaid: false },
    ] }, new Date(2026, 11, 31), 7);
    assert.equal(summary.expense, 100);
    assert.equal(summary.end, '2027-01-06');
    assert.equal(summary.rows.length, 2);
});
test('30 days can span three calendar months; pending income and paid rows stay separate', async () => {
    const { cashFlow } = await import('../src/domain/finance.js');
    const incomeSources = [{ id: 4, type: 'recurring', startDate: '2026-01-01', dayOfMonth: 1, amount: 100 }];
    const summary = cashFlow({ incomeSources, statusTracker: { 'income:4:2026:2': true }, payments: [
        { id: 1, dueDate: '2026-02-01', amount: 10, isPaid: true },
        { id: 2, dueDate: '2026-03-01', amount: 20, isPaid: false },
    ] }, new Date(2026, 0, 31), 30);
    assert.equal(summary.end, '2026-03-01');
    assert.equal(summary.income, 100);
    assert.equal(summary.expense, 20);
});
test('missing statement is unknown, while an explicitly saved zero is known', async () => {
    const { paymentItemsForMonth, cashFlow } = await import('../src/domain/finance.js');
    const products = [{ id: 1, type: 'card', name: 'Card', paymentDueDay: 5 }];
    const date = new Date(2026, 10, 1);
    const missing = paymentItemsForMonth([], products, date);
    assert.equal(missing[0].amount, null);
    assert.equal(missing[0].needsCardAmount, true);
    const known = paymentItemsForMonth([{ id: 2, productId: 1, type: 'card', dueDate: '2026-11-05', amount: 0 }], products, date);
    assert.equal(known.length, 1);
    assert.equal(known[0].needsCardAmount, false);
    assert.equal(cashFlow({ products }, date, 7).missing.length, 1);
    assert.equal(cashFlow({ products, payments: known }, date, 7).missing.length, 0);
});
test('linked virtual cards do not add another missing statement', async () => {
    const { paymentItemsForMonth } = await import('../src/domain/finance.js');
    const products = [{ id: 1, type: 'card', paymentDueDay: 5 }, { id: 2, type: 'card', paymentDueDay: 5, parentCardId: 1 }];
    assert.equal(paymentItemsForMonth([], products, new Date(2026, 10, 1)).length, 1);
});
test('card subscriptions are visible but not counted again over the card statement', async () => {
    const { cashFlow } = await import('../src/domain/finance.js');
    const summary = cashFlow({
        products: [{ id: 1, type: 'card', name: 'Card', paymentDueDay: 5 }],
        payments: [{ id: 2, productId: 1, type: 'card', dueDate: '2026-11-05', amount: 500, isPaid: false }],
        subscriptionSources: [
            { id: 3, type: 'recurring', startDate: '2026-01-01', dayOfMonth: 4, amount: 100, relatedCardId: 1 },
            { id: 4, type: 'recurring', startDate: '2026-01-01', dayOfMonth: 4, amount: 50 },
            { id: 5, type: 'recurring', startDate: '2026-01-01', dayOfMonth: 4, amount: 99 },
        ], statusTracker: { sub_archived_5: true },
    }, new Date(2026, 10, 1), 7);
    assert.equal(summary.expense, 550);
    assert.equal(summary.cardSubscriptions, 1);
    assert.equal(summary.rows.length, 3);
});
test('excluded expenses remain intact and neither enter totals nor missing-information warnings', async () => {
    const { cashFlow } = await import('../src/domain/finance.js');
    const source = Object.freeze({ id: 303, title: 'Fixture', type: 'market', amount: 10 });
    const summary = cashFlow({ expenseSources: [source], statusTracker: { 'expense_excluded:303': true } }, new Date(2026, 10, 1));
    assert.equal(summary.expense, 0);
    assert.equal(summary.incomplete.length, 0);
    assert.equal(source.type, 'market');
});
test('overdue recorded payments are shown separately, not hidden inside the interval difference', async () => {
    const { cashFlow } = await import('../src/domain/finance.js');
    const summary = cashFlow({ payments: [{ id: 1, dueDate: '2026-10-01', amount: 200, isPaid: false }] }, new Date(2026, 10, 1));
    assert.equal(summary.overdueCount, 1);
    assert.equal(summary.overdueTotal, 200);
    assert.equal(summary.expense, 0);
});

test('one-time history uses its own date and ignores an obsolete recurring end date', () => {
    const source = { id: 1, type: 'one-time', date: '2026-01-31', endDate: '2026-01-30', amount: 100 };
    assert.equal(sourceIssue(source, 'expense'), null);
    assert.equal(inMonth(source, 2026, 1).length, 1);
});

test('an unlinked virtual card never gets its own statement; its subscription link is flagged', async () => {
    const { paymentItemsForMonth, cashFlow } = await import('../src/domain/finance.js');
    const products = [{ id: 1, type: 'card', cardType: 'virtual', paymentDueDay: 5 }];
    assert.equal(paymentItemsForMonth([], products, new Date(2026, 10, 1)).length, 0);
    const summary = cashFlow({ products, subscriptionSources: [{ id: 2, type: 'recurring', startDate: '2026-01-01', dayOfMonth: 5, amount: 100, relatedCardId: 1 }] }, new Date(2026, 10, 1));
    assert.equal(summary.unlinkedCardSubscriptions, 1);
    assert.equal(summary.incomplete.length, 0);
    assert.equal(summary.expense, 0);
});
