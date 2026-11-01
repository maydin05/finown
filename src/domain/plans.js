import {
  calendarDate,
  dateKey,
  monthDate,
  sourceItems,
  sourceIssue,
  legacyOwners,
  isSourceExcluded,
  paymentItemsForMonth,
} from "./finance.js";

export function newLoanPlan(product) {
  const amount = Number(product.installmentAmount),
    count = Number(product.totalInstallments),
    first = calendarDate(product.firstPaymentDate);
  const cents = Math.round(amount * 100);
  if (
    !product.name?.trim() ||
    !Number(product.bankId) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.abs(amount * 100 - cents) > 0.000001 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 600 ||
    !first ||
    !Number.isSafeInteger(cents * count)
  )
    throw Object.assign(new Error("Kredi bilgileri eksik veya geçersiz."), {
      userMessage:
        "Banka, kredi adı, pozitif taksit tutarı, 1–600 taksit ve geçerli ilk ödeme tarihi gerekli.",
    });
  return Array.from({ length: count }, (_, index) => ({
    amount: cents / 100,
    dueDate: dateKey(
      monthDate(first.getFullYear(), first.getMonth() + index, first.getDate()),
    ),
    isPaid: false,
    subtitle: `Kredi Taksiti ${index + 1}/${count}`,
  }));
}
export function loanRemaining(product, payments = []) {
  const rows = payments.filter(
    (p) => p.type === "loan" && String(p.productId) === String(product.id),
  );
  if (rows.length)
    return (
      rows
        .filter((p) => !p.isPaid)
        .reduce((sum, p) => sum + Math.round(Number(p.amount || 0) * 100), 0) /
      100
    );
  return Number(
    product.remaining ??
      Number(product.installmentAmount || 0) *
        Number(product.totalInstallments || 0),
  );
}
export function debtPlan(source, data = {}) {
  const error = sourceIssue(source, "expense");
  if (error) return { source, error, rows: [], remaining: null };
  if (isSourceExcluded(source, "expense", data.statusTracker))
    return {
      source,
      error: "Bu borç planı takip dışında.",
      rows: [],
      remaining: null,
    };
  const first = calendarDate(
      source.type === "one-time"
        ? source.date
        : source.startDate || source.date,
    ),
    last = source.type === "one-time" ? first : calendarDate(source.endDate);
  if (!last)
    return {
      source,
      error: "Borç planının bitiş tarihi gerekli.",
      rows: [],
      remaining: null,
    };
  const months =
    (last.getFullYear() - first.getFullYear()) * 12 +
    last.getMonth() -
    first.getMonth();
  if (months < 0 || months > 1200)
    return {
      source,
      error: "Borç planının tarih aralığı geçersiz.",
      rows: [],
      remaining: null,
    };
  const owners = legacyOwners({
      ...data,
      expenseSources: data.expenseSources || [source],
    }),
    rows = [];
  for (let i = 0; i <= months; i++)
    rows.push(
      ...sourceItems(
        [source],
        data.statusTracker || {},
        new Date(first.getFullYear(), first.getMonth() + i, 1),
        "expense",
        [],
        owners,
      ),
    );
  if (rows.some((r) => r.hasAmbiguousStatus))
    return {
      source,
      error: "Geçmiş ödeme durumu doğrulanmalı.",
      rows,
      remaining: null,
    };
  const pending = rows.filter((r) => !r.isPaid);
  return {
    source,
    rows,
    pending,
    remaining:
      pending.reduce((sum, r) => sum + Math.round(Number(r.amount) * 100), 0) /
      100,
    total:
      rows.reduce((sum, r) => sum + Math.round(Number(r.amount) * 100), 0) /
      100,
  };
}
export function debtPlans(data = {}) {
  return (data.expenseSources || [])
    .filter((s) => s.isDebt)
    .map((s) => debtPlan(s, data));
}

// Calendar filters never mutate records or guess past source payments.
export function duePayments(data, monthItems, filter, today = new Date()) {
  if (filter === "all") return monthItems.filter((r) => !r.isPaid);
  const start = calendarDate(today),
    last = new Date(start);
  last.setDate(last.getDate() + 7);
  const owners = legacyOwners(data),
    sources = [];
  for (
    let month = new Date(start.getFullYear(), start.getMonth(), 1);
    month < last;
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  )
    sources.push(
      ...sourceItems(
        data.expenseSources || [],
        data.statusTracker || {},
        month,
        "expense",
        [],
        owners,
      ),
      ...paymentItemsForMonth(data.payments || [], data.products || [], month),
    );
  // Recorded payments can be overdue across older months. Recurring arrears are not invented.
  const rows = [
    ...(data.payments || []).map((p) => ({
      ...p,
      recordType: "payment",
      dueDate: dateKey(p.dueDate || p.date),
      needsCardAmount: p.type === "card" && p.amount == null,
    })),
    ...sources,
  ];
  // Keep missing physical card statements from the current monthly list visible too.
  rows.push(
    ...monthItems.filter(
      (p) => p.isVirtual && !rows.some((x) => x.id === p.id),
    ),
  );
  const unique = [
    ...new Map(
      rows.map((r) => [`${r.recordType}:${r.id}:${r.dueDate}`, r]),
    ).values(),
  ];
  return unique
    .filter((r) => {
      const date = calendarDate(r.dueDate);
      if (!date || r.isPaid) return false;
      return filter === "overdue"
        ? date < start
        : filter === "today"
          ? dateKey(date) === dateKey(start)
          : date >= start && date < last;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
