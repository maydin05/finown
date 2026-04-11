import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useViewData } from '../hooks/useViewData';
import { SubscriptionItem } from '../components/items/SubscriptionItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export default function Subscriptions({ viewDate, prevMonth, nextMonth, onOpenModal }) {
    const { subscriptionSources, statusTracker, banks, products, toggleTracker } = useData();
    const [showArchived, setShowArchived] = useState(false);

    // 1. Generate items
    const allSubs = useViewData(subscriptionSources, statusTracker, viewDate, "subscription");

    // 2. Split active vs archived
    const activeSubs = allSubs.filter(s => !statusTracker[`sub_archived_${s.id}`]);
    const archivedSubs = allSubs.filter(s => !!statusTracker[`sub_archived_${s.id}`]);

    // 3. Totals (only active)
    const totalCost = activeSubs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const annualProjection = totalCost * 12;

    const handleTogglePaid = (item) => {
        if (!item.trackerKey) return;
        toggleTracker(item.trackerKey, item.isPaid);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-purple-900 text-white p-6 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-xs text-purple-200 font-medium">{viewDate.getFullYear()} Abonelikler</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-3xl shadow-lg shadow-purple-900/40 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                            <Icon name="monitor" size={120} className="text-white" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/5 mask-image-diagonal rounded-3xl pointer-events-none"></div>
                        <div className="text-white relative z-10 flex w-full justify-between">
                            <div className="flex-1">
                                <p className="text-purple-200 text-[11px] font-bold tracking-widest uppercase mb-1">Aylık Toplam</p>
                                <h3 className="text-4xl font-extrabold tracking-tight mb-3">₺{formatMoneyTR(totalCost)}</h3>
                                
                                <div className="bg-white/10 rounded-xl p-3 border border-white/10 inline-block w-full max-w-[200px] backdrop-blur-sm">
                                    <p className="text-[10px] text-purple-200 uppercase tracking-widest font-bold mb-0.5">Yıllık Projeksiyon</p>
                                    <p className="text-lg font-bold text-white">₺{formatMoneyTR(annualProjection)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-1 min-h-[300px]">
                {/* Active Subscriptions */}
                {activeSubs.map((item, idx) => (
                    <SubscriptionItem
                        key={`${item.id}-${idx}`}
                        item={item}
                        banks={banks}
                        products={products}
                        onTogglePaid={() => handleTogglePaid(item)}
                        onOpenNote={(itm) => onOpenModal("note", { ...itm, sourceType: 'subscription' })}
                        onEdit={(itm) => onOpenModal("subscription", itm)}
                        onDelete={(itm) => onOpenModal("delete_subscription", itm)}
                    />
                ))}

                {activeSubs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Icon name="monitor" size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Aktif abonelik bulunamadı.</p>
                    </div>
                )}

                {/* Archived Toggle - Compact */}
                {archivedSubs.length > 0 && (
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
