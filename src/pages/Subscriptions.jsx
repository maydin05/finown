import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useViewData } from '../hooks/useViewData';
import { SubscriptionItem } from '../components/items/SubscriptionItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

// Helper: how many times per year a billing cycle pays
const cycleMultiplier = (cycle) => {
    switch (cycle) {
        case 'quarterly': return 4;
        case 'semi-annual': return 2;
        case 'annual': return 1;
        default: return 12; // monthly
    }
};

// Helper: billing cycle interval in months
const cycleInterval = (cycle) => {
    switch (cycle) {
        case 'quarterly': return 3;
        case 'semi-annual': return 6;
        case 'annual': return 12;
        default: return 1;
    }
};

export default function Subscriptions({ viewDate, prevMonth, nextMonth, onOpenModal }) {
    const { subscriptionSources, statusTracker, banks, products, toggleTracker } = useData();
    const [showArchived, setShowArchived] = useState(false);
    const [tab, setTab] = useState("pending"); // "pending" | "paid"

    // 1. Generate items for current view month
    const allSubs = useViewData(subscriptionSources, statusTracker, viewDate, "subscription");

    // 2. Split active vs archived
    const activeSubs = allSubs.filter(s => !statusTracker[`sub_archived_${s.id}`]);
    const archivedSubs = allSubs.filter(s => !!statusTracker[`sub_archived_${s.id}`]);

    // 3. Split by paid status
    const pendingSubs = activeSubs.filter(s => !s.isPaid);
    const paidSubs = activeSubs.filter(s => s.isPaid);
    const displaySubs = tab === "pending" ? pendingSubs : paidSubs;

    // 4. Totals - use ALL active sources (not just current month view) for projections
    const allActiveSources = (subscriptionSources || []).filter(s => 
        !statusTracker[`sub_archived_${s.id}`] && s.type === 'recurring'
    );

    // This month's cost (from visible items)
    const monthCost = activeSubs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // Smart annual projection: each sub contributes amount * cycleMultiplier
    const annualProjection = allActiveSources.reduce((acc, s) => {
        return acc + Number(s.amount || 0) * cycleMultiplier(s.billingCycle);
    }, 0);

    // Historical total spending: how much paid since start of each subscription until now
    const totalSpent = useMemo(() => {
        const now = new Date();
        return allActiveSources.reduce((total, source) => {
            const startSource = source.startDate || source.date;
            if (!startSource) return total;
            const start = new Date(startSource);
            const endSource = source.endDate ? new Date(source.endDate) : now;
            const effectiveEnd = endSource < now ? endSource : now;

            // Months between start and now
            const monthsDiff = (effectiveEnd.getFullYear() - start.getFullYear()) * 12 
                + (effectiveEnd.getMonth() - start.getMonth());
            if (monthsDiff < 0) return total;

            const interval = cycleInterval(source.billingCycle);
            const paymentsCount = Math.floor(monthsDiff / interval) + 1; // +1 includes the start month
            return total + paymentsCount * Number(source.amount || 0);
        }, 0);
    }, [allActiveSources]);

    const paidTotal = paidSubs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const pendingTotal = pendingSubs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const handleTogglePaid = (item) => {
        if (!item.trackerKey) return;
        toggleTracker(item.trackerKey, item.isPaid);
    };

    const renderItem = (item, idx, prefix = "") => (
        <SubscriptionItem
            key={`${prefix}${item.id}-${idx}`}
            item={item}
            banks={banks}
            products={products}
            onTogglePaid={() => handleTogglePaid(item)}
            onOpenNote={(itm) => onOpenModal("note", { ...itm, sourceType: 'subscription' })}
            onEdit={(itm) => onOpenModal("subscription", itm)}
            onDelete={(itm) => onOpenModal("delete_subscription", itm)}
        />
    );

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-purple-900 text-white p-5 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-10 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-[11px] text-purple-200 font-medium">{viewDate.getFullYear()} Abonelikler</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-900/30 relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-4 opacity-15">
                            <Icon name="monitor" size={80} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            {/* Main amount */}
                            <div className="flex items-end justify-between mb-3">
                                <div>
                                    <p className="text-purple-200 text-[10px] font-bold tracking-widest uppercase mb-0.5">Bu Ay</p>
                                    <h3 className="text-3xl font-extrabold tracking-tight">₺{formatMoneyTR(monthCost)}</h3>
                                </div>
                            </div>
                            {/* Sub metrics */}
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10">
                                    <p className="text-[8px] text-purple-200 uppercase tracking-widest font-bold">Yıllık Proje.</p>
                                    <p className="text-sm font-bold text-white">₺{formatMoneyTR(annualProjection)}</p>
                                </div>
                                <div className="flex-1 bg-white/10 rounded-xl px-2.5 py-1.5 border border-white/10">
                                    <p className="text-[8px] text-purple-200 uppercase tracking-widest font-bold">Top. Harcama</p>
                                    <p className="text-sm font-bold text-white">₺{formatMoneyTR(totalSpent)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-1">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setTab("pending")}
                        className={`flex-1 py-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                            tab === "pending"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Icon name="clock" size={13} className="text-current" />
                            <span className="text-sm font-bold">Ödenecek</span>
                            {pendingSubs.length > 0 && (
                                <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {pendingSubs.length}
                                </span>
                            )}
                        </div>
                        <span className={`text-[11px] font-bold mt-0.5 ${tab === "pending" ? "text-purple-600" : "text-gray-400"}`}>
                            ₺{formatMoneyTR(pendingTotal)}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab("paid")}
                        className={`flex-1 py-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                            tab === "paid"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <Icon name="check-circle" size={13} className="text-current" />
                            <span className="text-sm font-bold">Ödendi</span>
                            {paidSubs.length > 0 && (
                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {paidSubs.length}
                                </span>
                            )}
                        </div>
                        <span className={`text-[11px] font-bold mt-0.5 ${tab === "paid" ? "text-emerald-600" : "text-gray-400"}`}>
                            ₺{formatMoneyTR(paidTotal)}
                        </span>
                    </button>
                </div>
            </div>

            <div className="px-1 min-h-[200px]">
                {displaySubs.map((item, idx) => renderItem(item, idx))}

                {displaySubs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Icon name={tab === "pending" ? "party-popper" : "clock"} size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">
                            {tab === "pending" 
                                ? "Tüm abonelikler ödendi! 🎉" 
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
                            <Icon name={showArchived ? "chevron-up" : "chevron-down"} size={14} className="text-current" />
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
                                        onOpenNote={(itm) => onOpenModal("note", { ...itm, sourceType: 'subscription' })}
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
