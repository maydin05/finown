import test from 'node:test';
import assert from 'node:assert/strict';
import { cashFlow } from '../src/domain/finance.js';
import { incomeBridge } from '../src/domain/incomeBridge.js';

const source = (id, date, amount) => ({ id, title: 'Fixture', type: 'one-time', date, amount });
const data = () => ({
  incomeSources: [source(901, '2026-11-05', 15000)],
  expenseSources: [source(902, '2026-11-02', 1500), source(903, '2026-11-04', 2000)],
  products: [{ id: 904, type: 'card', paymentDueDay: 6, cardType: 'physical' }],
  subscriptionSources: [{ ...source(905, '2026-11-03', 500), relatedCardId: 904 }],
  statusTracker: {},
});
const today = new Date(2026, 10, 1);

test('income preparation separates timing from a positive period total and counts no card subscription twice', () => {
  const fixture = data(), before = JSON.stringify(fixture);
  const summary = cashFlow(fixture, today, 7), bridge = incomeBridge(summary);
  assert.equal(summary.difference, 11500);
  assert.equal(bridge.amount, 3500);
  assert.equal(bridge.incomeDate, '2026-11-05');
  assert.equal(bridge.before.length, 2);
  assert.equal(bridge.unknown, 0); // The unknown statement is after the first income.
  assert.equal(JSON.stringify(fixture), before);
  assert.equal(incomeBridge(cashFlow(fixture, today, 30)).amount, 3500);
});

test('delayed income includes an unknown earlier statement as a lower bound, then uses its saved amount', () => {
  const fixture = data();
  fixture.incomeSources[0].date = '2026-11-07';
  let bridge = incomeBridge(cashFlow(fixture, today, 7));
  assert.equal(bridge.amount, 3500);
  assert.equal(bridge.unknown, 1);
  fixture.payments = [{ id: 906, productId: 904, type: 'card', amount: 1800, dueDate: '2026-11-06', isPaid: false }];
  bridge = incomeBridge(cashFlow(fixture, today, 7));
  assert.equal(bridge.amount, 5300);
  assert.equal(bridge.unknown, 0);
  fixture.payments[0].amount = 0;
  bridge = incomeBridge(cashFlow(fixture, today, 7));
  assert.equal(bridge.amount, 3500);
  assert.equal(bridge.unknown, 0); // An explicitly saved zero is known.
});

test('same-day payments remain separate; received income and paid rows never become future funding or obligations', () => {
  const fixture = data();
  fixture.incomeSources[0].date = '2026-11-04';
  const bridge = incomeBridge(cashFlow(fixture, today, 7));
  assert.equal(bridge.amount, 1500);
  assert.equal(bridge.sameDayAmount, 2000);
  assert.equal(bridge.sameDay.length, 1);
  fixture.statusTracker = { 'income:901:2026:11': true, 'expense:902:2026:11': true };
  const paid = incomeBridge(cashFlow(fixture, today, 7));
  assert.equal(paid.incomeDate, null);
  assert.equal(paid.amount, 2000);
  assert.equal(paid.unknown, 1);
});

test('no-income is bounded to the selected window and crosses month/year boundaries', () => {
  const fixture = { incomeSources: [source(1, '2027-01-08', 100)], expenseSources: [source(2, '2027-01-02', 30)] };
  const start = new Date(2026, 11, 30);
  const short = incomeBridge(cashFlow(fixture, start, 7));
  assert.equal(short.incomeDate, null);
  assert.equal(short.amount, 30);
  const long = incomeBridge(cashFlow(fixture, start, 30));
  assert.equal(long.incomeDate, '2027-01-08');
  assert.equal(long.amount, 30);
});

test('first positive unambiguous income is grouped by day; zero and ambiguous income do not imply funding', () => {
  const rows = [
    { direction: 'in', dueDate: '2026-11-01', amount: 0 },
    { direction: 'in', dueDate: '2026-11-02', amount: 500, hasAmbiguousStatus: true },
    { direction: 'in', dueDate: '2026-11-03', amount: 100, isReceived: true },
    { direction: 'in', dueDate: '2026-11-04', amount: 100 },
    { direction: 'in', dueDate: '2026-11-04', amount: 200 },
    { direction: 'out', dueDate: '2026-11-02', amount: 0.1 },
    { direction: 'out', dueDate: '2026-11-03', amount: 0.2 },
    { direction: 'out', dueDate: '2026-11-03', amount: 100, isPaid: true },
    { direction: 'out', dueDate: '2026-11-04', amount: null },
  ].map(Object.freeze);
  Object.freeze(rows);
  const bridge = incomeBridge({ rows, ambiguous: 1 });
  assert.equal(bridge.incomeDate, '2026-11-04');
  assert.equal(bridge.incomeAmount, 300);
  assert.equal(bridge.amount, 0.3);
  assert.equal(bridge.sameDayUnknown, 1);
  assert.equal(bridge.hasUnverifiedData, true);
});

test('missing records remain flagged and an empty schedule cannot claim that income covers payments', () => {
  const bridge = incomeBridge(cashFlow({ incomeSources: [source(1, '', 100)] }, today, 7));
  assert.equal(bridge.incomeDate, null);
  assert.equal(bridge.amount, 0);
  assert.equal(bridge.hasUnverifiedData, true);
  const first = incomeBridge(cashFlow({ incomeSources: [source(1, '2026-11-01', 100)], expenseSources: [source(2, '2026-11-02', 30)] }, today, 7));
  assert.equal(first.before.length, 0);
  assert.equal(first.amount, 0);
});
