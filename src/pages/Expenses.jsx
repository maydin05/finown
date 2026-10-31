import { MonthHeader, FilterTabs } from "../components/ui/MonthHeader";
import React, { useMemo } from "react";
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

export default function Expenses({
  viewDate,
  prevMonth,
  nextMonth,
  onOpenModal,
  paymentTab,
  setPaymentTab,
}) {
  const {
    payments,
    expenseSources,
    statusTracker,
    toggleTracker,
    editPayment,
    products,
  } = useData();

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
  const filteredList = allItems.filter((item) =>
    paymentTab === "pending" ? !item.isPaid : item.isPaid,
  );

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
    <div className="calm-page tone-payments">
      <MonthHeader
        title="Ödemeler"
        viewDate={viewDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
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
        <section
          className="mx-1 p-4 rounded-2xl border border-amber-200 bg-amber-50"
          aria-label="Bilgisi tamamlanmalı"
        >
          <h3 className="font-bold text-amber-900">
            Bilgisi tamamlanmalı ({incompleteSources.length})
          </h3>
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
        </section>
      )}
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
      <FilterTabs
        value={paymentTab}
        onChange={setPaymentTab}
        items={[
          { value: "pending", label: "Ödenecekler" },
          { value: "paid", label: "Ödenmişler" },
        ]}
      />
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
    </div>
  );
}
