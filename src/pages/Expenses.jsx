import { MonthHeader, FilterTabs } from "../components/ui/MonthHeader";
import React, { useMemo, useState } from "react";
import { useData } from "../context/store";
import { useViewData } from "../hooks/useViewData";
import { PaymentItem } from "../components/items/PaymentItem";
import { Icon } from "../components/ui/Icon";
import { formatMoneyTR } from "../utils";
import {
  deletionType,
  sourceIssue,
  isSourceExcluded,
  paymentItemsForMonth,
} from "../domain/finance";

import { duePayments } from "../domain/plans";
import { formatDateTR } from "../utils";

export default function Expenses({
  viewDate,
  prevMonth,
  nextMonth,
  onThisMonth,
  onOpenModal,
  paymentTab,
  setPaymentTab,
}) {
  const data = useData();
  const [dueFilter, setDueFilter] = useState("all");
  const {
    payments,
    expenseSources,
    statusTracker,
    toggleTracker,
    editPayment,
    products,
  } = data;

  // 1. Generate recurring/one-time items from Sources
  const expenseItems = useViewData(
    expenseSources,
    statusTracker,
    viewDate,
    "expense",
  );

  const paymentRows = useMemo(
    () => paymentItemsForMonth(payments, products, viewDate),
    [payments, products, viewDate],
  );

  // 3. Merge
  const allItems = useMemo(() => {
    return [...expenseItems, ...paymentRows].sort(
      (a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date),
    );
  }, [expenseItems, paymentRows]);

  // 4. Calculate Totals
  const totalRemaining = allItems
    .filter((i) => !i.isPaid)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalPaid = allItems
    .filter((i) => i.isPaid)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // 5. Filter for Tab
  const filteredList =
    paymentTab === "pending"
      ? duePayments(data, allItems, dueFilter)
      : allItems.filter((item) => item.isPaid);

  const incompleteSources = expenseSources.filter(
    (source) =>
      !isSourceExcluded(source, "expense", statusTracker) &&
      sourceIssue(source, "expense"),
  );
  const cardTrackedSources = expenseSources.filter((source) =>
    isSourceExcluded(source, "expense", statusTracker),
  );
  const handleToggle = async (item) => {
    try {
      if (item.recordType === "payment") {
        if (item.isPaid) await editPayment(item.id, { isPaid: false });
        else onOpenModal("payment_confirm", item);
      } else {
        await toggleTracker(item.trackerKey, item.isPaid);
      }
    } catch (error) {
      if (item.recordType === "payment")
        alert("Ödeme durumu kaydedilemedi: " + error.message);
    }
  };

  return (
    <div className="calm-page compact-list-page tone-payments">
      <MonthHeader
        title="Ödemeler"
        viewDate={viewDate}
        prevMonth={() => {
          setDueFilter("all");
          prevMonth();
        }}
        nextMonth={() => {
          setDueFilter("all");
          nextMonth();
        }}
        onThisMonth={() => {
          setDueFilter("all");
          onThisMonth?.();
        }}
        label="Bilinen ödemeler"
        amount={totalRemaining}
        secondary={[{ label: "Ödenen", amount: totalPaid }]}
      />
      {paymentRows.some((item) => item.needsCardAmount) && (
        <p className="notice">
          {paymentRows.filter((item) => item.needsCardAmount).length} kartın
          ekstre tutarı girilmedi; aylık toplam kesinleşmedi.
        </p>
      )}
      {incompleteSources.length > 0 && (
        <details
          className="compact-source-warning"
          aria-label="Bilgisi tamamlanmalı"
        >
          <summary>
            Bilgisi tamamlanmalı ({incompleteSources.length})
          </summary>
          <p className="text-xs text-amber-800 mt-1">
            Bu kayıtlar doğrulanana kadar ödeme toplamına dahil değil. Mevcut
            kayıtlar değiştirilmedi.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {incompleteSources.map((source) => (
              <li key={source.id}>
                <strong>{source.title}</strong> · ₺
                {formatMoneyTR(source.amount)}
                <p className="text-xs text-amber-800">
                  {sourceIssue(source, "expense")}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
      <FilterTabs
        value={paymentTab}
        onChange={setPaymentTab}
        items={[
          { value: "pending", label: "Ödenecekler" },
          { value: "paid", label: "Ödenmişler" },
        ]}
      />
      {paymentTab === "pending" && (
        <>
          <div className="due-filters" role="group" aria-label="Vade filtresi">
            {[
              ["all", "Tümü"],
              ["overdue", "Geciken"],
              ["today", "Bugün"],
              ["week", "7 gün"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={dueFilter === key}
                onClick={() => {
                  setDueFilter(key);
                  if (key !== "all") onThisMonth?.();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {dueFilter !== "all" && (
            <p className="filter-caption">
              {dueFilter === "week"
                ? `Liste: ${formatDateTR(new Date())} – ${formatDateTR(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6))}`
                : dueFilter === "today"
                  ? "Liste: Bugün vadesi gelen ödemeler"
                  : "Liste: Kaydedilmiş geciken ödemeler"}{" "}
              · Üstteki özet seçili aya aittir.
            </p>
          )}
        </>
      )}
      <div className="record-list">
        {filteredList.map((item, idx) => (
          <PaymentItem
            key={`${item.id}-${idx}`}
            item={item}
            onToggle={() => handleToggle(item)}
            onEdit={(itm) => {
              // Card payments (virtual or real) should open CardAmountModal
              if (itm.isVirtual || itm.type === "card" || itm.productId) {
                onOpenModal("card_amount", itm);
              } else {
                // Expense sources open SourceModal
                onOpenModal("expense", { ...itm, sourceType: "expense" });
              }
            }}
            onDelete={
              !item.isVirtual
                ? (itm) => {
                    const type = deletionType(itm);
                    if (type) onOpenModal(`delete_${type}`, itm);
                  }
                : null
            }
            onCardNeedAmount={(row) => onOpenModal("card_amount", row)}
          />
        ))}
        {filteredList.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon
              name="check-circle"
              size={48}
              className="mx-auto mb-3 opacity-20"
            />
            <p>Kayıt bulunamadı.</p>
          </div>
        )}
      </div>
      {cardTrackedSources.length > 0 && (
        <details className="mx-1 p-3 border border-gray-200 rounded-xl text-sm text-gray-600">
          <summary>
            Kart ekstresinden takip edilen giderler ({cardTrackedSources.length}
            )
          </summary>
          <p className="text-xs mt-2">
            Ayrı gider olarak toplanmaz; eski kayıtlar korunur.
          </p>
          <ul className="mt-2">
            {cardTrackedSources.map((source) => (
              <li key={source.id}>{source.title}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
