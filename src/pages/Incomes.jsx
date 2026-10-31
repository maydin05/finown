import { MonthHeader, FilterTabs } from "../components/ui/MonthHeader";
import React from "react";
import { useData } from "../context/store";
import { useViewData } from "../hooks/useViewData";
import { IncomeItem } from "../components/items/IncomeItem";
import { Icon } from "../components/ui/Icon";

export default function Incomes({
  viewDate,
  prevMonth,
  nextMonth,
  onOpenModal,
  incomeTab,
  setIncomeTab,
}) {
  const { incomeSources, statusTracker, toggleTracker } = useData();

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
    toggleTracker(item.trackerKey, item.isReceived).catch(() => {});
  };

  return (
    <div className="calm-page tone-income">
      <MonthHeader
        title="Gelirler"
        viewDate={viewDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        label="Beklenen gelir"
        amount={totalExpected}
        secondary={[{ label: "Alınan", amount: totalReceived }]}
      />
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
            onEdit={(itm) => onOpenModal("income", itm)}
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
    </div>
  );
}
