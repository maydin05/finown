import React from 'react';
import { useData } from '../context/DataContext';
import { useViewData } from '../hooks/useViewData';
import { IncomeItem } from '../components/items/IncomeItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export default function Incomes({ viewDate, prevMonth, nextMonth, onOpenModal, incomeTab, setIncomeTab }) {
    const { incomeSources, statusTracker, toggleTracker, onOpenNote } = useData();

    // 1. Generate items
    const incomes = useViewData(incomeSources, statusTracker, viewDate, "income");

    // 2. Totals
    const totalExpected = incomes.filter((i) => !i.isReceived).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalReceived = incomes.filter((i) => i.isReceived).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 3. Filter tab
    const filteredList = incomes.filter((i) => (incomeTab === "expected" ? !i.isReceived : i.isReceived));

    const handleToggle = (item) => {
        const currentMonth = viewDate.getMonth();
        const currentYear = viewDate.getFullYear();
        const key = `${item.id}_${currentMonth}_${currentYear}`;
        toggleTracker(key, item.isReceived);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-teal-900 text-white p-6 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-xs text-teal-200 font-medium">{viewDate.getFullYear()} Gelirleri</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-gradient-to-br from-teal-500 to-teal-700 p-4 rounded-2xl shadow-lg shadow-teal-900/20">
                            <p className="text-teal-100 text-xs font-medium mb-1">Beklenen</p>
                            <h3 className="text-2xl font-bold">₺{formatMoneyTR(totalExpected)}</h3>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-2xl shadow-lg shadow-emerald-900/20">
                            <p className="text-emerald-100 text-xs font-medium mb-1">Alınan</p>
                            <h3 className="text-2xl font-bold">₺{formatMoneyTR(totalReceived)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-1 rounded-xl border border-gray-200 flex mx-1 shadow-sm">
                <button
                    onClick={() => setIncomeTab("expected")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${incomeTab === "expected" ? "bg-teal-50 text-teal-900" : "text-gray-400"
                        }`}
                >
                    Beklenen Ödemeler
                </button>
                <button
                    onClick={() => setIncomeTab("received")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${incomeTab === "received" ? "bg-emerald-50 text-emerald-700" : "text-gray-400"
                        }`}
                >
                    Alınan Ödemeler
                </button>
            </div>

            <div className="px-1 min-h-[300px]">
                {filteredList.map((item, idx) => (
                    <IncomeItem
                        key={`${item.id}-${idx}`}
                        item={item}
                        onToggle={() => handleToggle(item)}
                        onEdit={(itm) => onOpenModal("income", itm)}
                        onDelete={(itm) => onOpenModal("delete_income", itm)}
                        onOpenNote={(itm) => onOpenModal("note", { ...itm, sourceType: 'income' })}
                    />
                ))}
                {filteredList.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Icon name="check-circle" size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Kayıt bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
