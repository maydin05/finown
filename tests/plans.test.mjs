import test from "node:test";
import assert from "node:assert/strict";
import {
  newLoanPlan,
  loanRemaining,
  debtPlan,
  debtPlans,
  duePayments,
} from "../src/domain/plans.js";
import { paymentItemsForMonth } from "../src/domain/finance.js";

test("new loans clamp each installment independently and never guess paid status", () => {
  const plan = newLoanPlan({
    bankId: 1,
    name: "Fixture",
    installmentAmount: "1000.10",
    totalInstallments: "3",
    firstPaymentDate: "2026-01-31",
  });
  assert.deepEqual(
    plan.map((x) => x.dueDate),
    ["2026-01-31", "2026-02-28", "2026-03-31"],
  );
  assert(plan.every((x) => !x.isPaid));
  assert.equal(plan[0].amount, 1000.1);
  assert.throws(() =>
    newLoanPlan({
      bankId: 1,
      name: "X",
      installmentAmount: -1,
      totalInstallments: 3,
      firstPaymentDate: "2026-01-01",
    }),
  );
  assert.throws(() =>
    newLoanPlan({
      bankId: 1,
      name: "X",
      installmentAmount: 1.001,
      totalInstallments: 3,
      firstPaymentDate: "2026-01-01",
    }),
  );
});
test("remaining follows actual payments and preserves dates and statuses", () => {
  const product = { id: 1, remaining: 900 };
  const rows = [
    {
      id: 1,
      productId: 1,
      type: "loan",
      amount: 100,
      isPaid: true,
      dueDate: "2026-01-02",
    },
    {
      id: 2,
      productId: 1,
      type: "loan",
      amount: 100,
      isPaid: false,
      dueDate: "2026-02-03",
    },
  ];
  const before = JSON.stringify(rows);
  assert.equal(loanRemaining(product, rows), 100);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(loanRemaining({ ...product, remaining: 0 }, []), 0);
});
test("linked TL debt is counted from one finite expense plan and drops only marked installments", () => {
  const source = {
    id: 9003,
    title: "Fixture debt",
    isDebt: true,
    type: "recurring",
    amount: 1200,
    date: "2027-04-09",
    startDate: "2027-04-09",
    dayOfMonth: 9,
    endDate: "2028-06-09",
  };
  const data = { expenseSources: [source], statusTracker: {} };
  const plan = debtPlan(source, data);
  assert.equal(plan.rows.length, 15);
  assert.equal(plan.remaining, 18000);
  assert.equal(plan.rows[0].dueDate, "2027-04-09");
  assert.equal(plan.rows.at(-1).dueDate, "2028-06-09");
  assert.equal(
    debtPlans({ ...data, statusTracker: { "expense:9003:2027:4": true } })[0]
      .remaining,
    16800,
  );
  assert.equal(
    debtPlans({ expenseSources: [{ ...source, isDebt: false }] }).length,
    0,
  );
  assert(debtPlan({ ...source, endDate: null }, data).error);
  assert.equal(debtPlan({ ...source, endDate: null }, data).remaining, null);
});
test("debt status respects explicit undo and rejects ambiguous historic owner flags", () => {
  const source = {
    id: 1,
    type: "one-time",
    date: "2026-01-01",
    startDate: "2027-01-01",
    amount: 100,
    isDebt: true,
  };
  assert.equal(
    debtPlan(source, {
      expenseSources: [source],
      statusTracker: { "expense:1:2026:1": false, "1_0_2026": true },
    }).remaining,
    100,
  );
  assert(
    debtPlan(source, {
      expenseSources: [source],
      incomeSources: [{ id: 1 }],
      statusTracker: { "1_0_2026": true },
    }).error,
  );
});
test("due filters cross months, keep unknown card statements and do not duplicate actual payments", () => {
  const data = {
    products: [{ id: 1, type: "card", cardType: "physical", paymentDueDay: 2 }],
    payments: [
      {
        id: 1,
        productId: 2,
        type: "loan",
        dueDate: "2026-10-30",
        amount: 100,
        isPaid: false,
      },
      {
        id: 2,
        productId: 2,
        type: "loan",
        dueDate: "2026-11-01",
        amount: 100,
        isPaid: false,
      },
      {
        id: 3,
        productId: 2,
        type: "loan",
        dueDate: "2026-11-01",
        amount: 100,
        isPaid: true,
      },
    ],
    expenseSources: [],
  };
  const current = paymentItemsForMonth(
    data.payments,
    data.products,
    new Date(2026, 9, 1),
  );
  const before = JSON.stringify(data);
  const week = duePayments(data, current, "week", new Date(2026, 9, 31));
  assert.equal(week.length, 2);
  assert(week.some((r) => r.needsCardAmount && r.dueDate === "2026-11-02"));
  assert.equal(
    duePayments(data, current, "overdue", new Date(2026, 9, 31)).length,
    2,
  );
  assert.equal(
    duePayments(data, current, "today", new Date(2026, 10, 1)).length,
    1,
  );
  assert.equal(JSON.stringify(data), before);
});
