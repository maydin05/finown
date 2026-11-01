import { MonthHeader, FilterTabs } from "../components/ui/MonthHeader";
import React, { useState } from "react";
import { useData } from "../context/store";
import { useViewData } from "../hooks/useViewData";
import { IncomeItem } from "../components/items/IncomeItem";
import { Icon } from "../components/ui/Icon";

import IncomeReceiptModal from "../modals/IncomeReceiptModal";
import { incomeReceiptInput } from "../domain/incomeReceipts";

export default function Incomes({
  viewDate,
  prevMonth,
  nextMonth,
  onThisMonth,
  onOpenModal,
  incomeTab,
  setIncomeTab,
}) {
  const { incomeSources, statusTracker, saveIncomeReceipt } = useData();

  const [receiptItem, setReceiptItem] = useState(null);

  // 1. Generate items
  const incomes = useViewData(incomeSources, statusTracker, viewDate, "income");

  // 2. Totals
  const totalExpected = incomes
    .filter((i) => !i.isReceived)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalReceived = incomes
    .filter((i) => i.isReceived)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // 3. Filter tab
  const filteredList = incomes.filter((i) =>
    incomeTab === "expected" ? !i.isReceived : i.isReceived,
  );

  const handleToggle = (item) => {
    if (!item.isReceived) { setReceiptItem(item); return; }
    return saveIncomeReceipt(incomeReceiptInput(item, item.actualAmount ?? item.amount, item.receiptNote || "", false)).then(() => setIncomeTab("expected"));
  };

  return (
    <div className="calm-page compact-list-page tone-income">
      <MonthHeader
        title="Gelirler"
        viewDate={viewDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        onThisMonth={onThisMonth}
        label="Beklenen gelir"
        amount={totalExpected}
        secondary={[{ label: "Alınan", amount: totalReceived }]}
      />
      {incomes.some(i => i.isReceived && i.actualAmount == null) && <p className="notice">Bazı eski alınan gelirlerde gerçek tutar kaydedilmemiş; planlanan tutar gösteriliyor. İlgili ayın tutarını düzenleyebilirsin.</p>}
      <FilterTabs
        value={incomeTab}
        onChange={setIncomeTab}
        items={[
          { value: "expected", label: "Beklenen" },
          { value: "received", label: "Alınan" },
        ]}
      />
      <div className="record-list">
        {filteredList.map((item, idx) => (
          <IncomeItem
            key={`${item.id}-${idx}`}
            item={item}
            onToggle={() => handleToggle(item)}
            onEdit={(itm) => onOpenModal("income", { ...itm, amount: itm.planAmount ?? itm.expectedAmount ?? itm.amount })}
            onEditReceipt={setReceiptItem}
            onDelete={(itm) => onOpenModal("delete_income", itm)}
            onOpenNote={(itm) =>
              onOpenModal("note", { ...itm, sourceType: "income" })
            }
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
      {receiptItem && <IncomeReceiptModal item={receiptItem} onSaved={() => setIncomeTab("received")} onClose={() => setReceiptItem(null)} />}
    </div>
  );
}
