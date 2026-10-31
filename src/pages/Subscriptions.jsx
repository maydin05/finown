import { MonthHeader, FilterTabs } from "../components/ui/MonthHeader";
import React, { useState, useMemo } from "react";
import { useData } from "../context/store";
import { useViewData } from "../hooks/useViewData";
import { SubscriptionItem } from "../components/items/SubscriptionItem";
import { Icon } from "../components/ui/Icon";

// Helper: how many times per year a billing cycle pays
const cycleMultiplier = (cycle) => {
  switch (cycle) {
    case "quarterly":
      return 4;
    case "semi-annual":
      return 2;
    case "annual":
      return 1;
    default:
      return 12; // monthly
  }
};

export default function Subscriptions({
  viewDate,
  prevMonth,
  nextMonth,
  onOpenModal,
}) {
  const {
    subscriptionSources,
    subscriptionPayments,
    statusTracker,
    banks,
    products,
    toggleSubscriptionPaid,
  } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const [tab, setTab] = useState("pending"); // "pending" | "paid"

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth() + 1; // 1-12

  // 1. Generate items for current view month
  const allSubs = useViewData(
    subscriptionSources,
    statusTracker,
    viewDate,
    "subscription",
    subscriptionPayments,
  );

  // 2. Split active vs archived
  const activeSubs = allSubs.filter(
    (s) => !statusTracker[`sub_archived_${s.id}`],
  );
  const archivedSubs = allSubs.filter(
    (s) => !!statusTracker[`sub_archived_${s.id}`],
  );

  // 3. Split by paid status
  const pendingSubs = activeSubs.filter((s) => !s.isPaid);
  const paidSubs = activeSubs.filter((s) => s.isPaid);
  const displaySubs = tab === "pending" ? pendingSubs : paidSubs;

  // 4. Totals - use ALL active sources (not just current month view) for projections
  const allActiveSources = (subscriptionSources || []).filter(
    (s) => !statusTracker[`sub_archived_${s.id}`],
  );

  // This month's cost: paid actual amounts + unpaid expected amounts
  const monthCost = activeSubs.reduce((acc, curr) => {
    if (
      curr.isPaid &&
      curr.actualAmount !== null &&
      curr.actualAmount !== undefined
    ) {
      return acc + Number(curr.actualAmount);
    }
    return acc + Number(curr.expectedAmount || curr.amount || 0);
  }, 0);

  // Smart annual projection
  const annualProjection = allActiveSources.reduce((acc, s) => {
    return acc + Number(s.amount || 0) * cycleMultiplier(s.billingCycle);
  }, 0);

  // Historical total spending: exact sum of all actual paid subscription payments
  const totalSpent = useMemo(() => {
    return (subscriptionPayments || [])
      .filter((p) => p.isPaid)
      .reduce(
        (sum, p) =>
          sum +
          Number(
            p.actualAmount !== null && p.actualAmount !== undefined
              ? p.actualAmount
              : p.expectedAmount || 0,
          ),
        0,
      );
  }, [subscriptionPayments]);

  const paidTotal = paidSubs.reduce(
    (acc, curr) =>
      acc +
      Number(
        curr.actualAmount !== null && curr.actualAmount !== undefined
          ? curr.actualAmount
          : curr.expectedAmount || curr.amount || 0,
      ),
    0,
  );
  const pendingTotal = pendingSubs.reduce(
    (acc, curr) => acc + Number(curr.expectedAmount || curr.amount || 0),
    0,
  );

  const handleTogglePaid = (item) => {
    if (item.isVariable && !item.isPaid) {
      onOpenModal("payment_entry", item);
    } else {
      toggleSubscriptionPaid(item.id, currentYear, currentMonth, item.isPaid);
    }
  };

  const renderItem = (item, idx, prefix = "") => (
    <SubscriptionItem
      key={`${prefix}${item.id}-${idx}`}
      item={item}
      banks={banks}
      products={products}
      onTogglePaid={() => handleTogglePaid(item)}
      onOpenPaymentEntry={(itm) => onOpenModal("payment_entry", itm)}
      onOpenNote={(itm) =>
        onOpenModal("note", { ...itm, sourceType: "subscription" })
      }
      onEdit={(itm) => onOpenModal("subscription", itm)}
      onDelete={(itm) => onOpenModal("delete_subscription", itm)}
    />
  );

  return (
    <div className="calm-page tone-subscriptions">
      <MonthHeader
        title="Abonelikler"
        viewDate={viewDate}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        label="Bu ay"
        amount={monthCost}
        secondary={[
          { label: "Yıllık tahmin", amount: annualProjection },
          { label: "Kaydedilen ödemeler", amount: totalSpent },
        ]}
      />
      <FilterTabs
        value={tab}
        onChange={setTab}
        items={[
          {
            value: "pending",
            label: "Ödenecek",
            count: pendingSubs.length,
            amount: pendingTotal,
          },
          {
            value: "paid",
            label: "Ödendi",
            count: paidSubs.length,
            amount: paidTotal,
          },
        ]}
      />
      <div className="record-list">
        {displaySubs.map((item, idx) => renderItem(item, idx))}

        {displaySubs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon
              name={tab === "pending" ? "party-popper" : "clock"}
              size={48}
              className="mx-auto mb-3 opacity-20"
            />
            <p className="text-sm">
              {tab === "pending"
                ? activeSubs.length
                  ? "Bu ayın abonelikleri ödendi."
                  : "Bu ay vadesi gelen abonelik yok."
                : "Henüz ödenen abonelik yok."}
            </p>
          </div>
        )}

        {/* Archived Toggle - Compact */}
        {tab === "pending" && archivedSubs.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors mx-auto"
            >
              <Icon name="archive" size={14} className="text-current" />
              <span>{archivedSubs.length} Arşivlenmiş Abonelik</span>
              <Icon
                name={showArchived ? "chevron-up" : "chevron-down"}
                size={14}
                className="text-current"
              />
            </button>

            {showArchived && (
              <div className="mt-3 opacity-60">
                {archivedSubs.map((item, idx) => (
                  <SubscriptionItem
                    key={`archived-${item.id}-${idx}`}
                    item={{ ...item, isArchived: true }}
                    banks={banks}
                    products={products}
                    onTogglePaid={() => {}}
                    onOpenNote={(itm) =>
                      onOpenModal("note", {
                        ...itm,
                        sourceType: "subscription",
                      })
                    }
                    onEdit={(itm) => onOpenModal("subscription", itm)}
                    onDelete={(itm) => onOpenModal("delete_subscription", itm)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
