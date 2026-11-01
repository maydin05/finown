import { calendarDate } from "./finance.js";

export function shortBridgeDate(value) {
  return calendarDate(value)?.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) || "";
}

// Read-only projection over the same pending rows used by the 7/30-day summary.
// This is a preparation amount, not a cash balance or a claim of insufficiency.
export function incomeBridge(summary) {
  const rows = summary.rows || [];
  const validAmount = (row) => !row.needsCardAmount && row.amount != null &&
    Number.isFinite(Number(row.amount)) && Number(row.amount) >= 0;
  const sum = (items) => items.filter(validAmount)
    .reduce((total, row) => total + Math.round(Number(row.amount) * 100), 0) / 100;
  const incomes = rows.filter((row) => row.direction === 'in' && !row.isReceived &&
    !row.hasAmbiguousStatus && validAmount(row) && Number(row.amount) > 0)
    .slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const incomeDate = incomes[0]?.dueDate || null;
  const nextIncomes = incomes.filter((row) => row.dueDate === incomeDate);
  const payments = rows.filter((row) => row.direction === 'out' && !row.isPaid);
  const before = payments.filter((row) => !incomeDate || row.dueDate < incomeDate);
  const sameDay = incomeDate ? payments.filter((row) => row.dueDate === incomeDate) : [];
  return {
    incomeDate, nextIncomes, incomeAmount: sum(nextIncomes),
    before, sameDay, amount: sum(before), sameDayAmount: sum(sameDay),
    unknown: before.filter((row) => !validAmount(row)).length,
    sameDayUnknown: sameDay.filter((row) => !validAmount(row)).length,
    hasUnverifiedData: Boolean(summary.incomplete?.length || summary.ambiguous || summary.unlinkedCardSubscriptions),
  };
}
