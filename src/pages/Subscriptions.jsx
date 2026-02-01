import React from 'react';
import { useData } from '../context/DataContext';
import { useViewData } from '../hooks/useViewData';
import { SubscriptionItem } from '../components/items/SubscriptionItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export default function Subscriptions({ viewDate, prevMonth, nextMonth, onOpenModal }) {
    const { subscriptionSources, subscriptionTracker, banks, products } = useData();

    // 1. Generate items
    const subs = useViewData(subscriptionSources, subscriptionTracker, viewDate, "subscription");

    // 2. Total
    const totalCost = subs.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

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

                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-900/40 flex justify-between items-center">
                        <div>
                            <p className="text-purple-100 text-xs font-medium mb-1">Aylık Toplam Tutar</p>
                            <h3 className="text-3xl font-bold">₺{formatMoneyTR(totalCost)}</h3>
                        </div>
                        <div className="bg-white/10 p-3 rounded-full">
                            <Icon name="monitor" size={24} className="text-purple-100" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-1 min-h-[300px]">
                {subs.map((item, idx) => (
                    <SubscriptionItem
                        key={`${item.id}-${idx}`}
                        item={item}
                        banks={banks}
                        products={products}
                        onOpenNote={(itm) => onOpenModal("note", { ...itm, sourceType: 'subscription' })}
                        onEdit={(itm) => onOpenModal("subscription", itm)}
                        onDelete={(itm) => onOpenModal("delete_subscription", itm)}
                    />
                ))}
                {subs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Icon name="monitor" size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Abonelik bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
