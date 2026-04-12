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
            <div className="bg-teal-900 text-white p-5 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-10 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-[11px] text-teal-200 font-medium">{viewDate.getFullYear()} Gelirleri</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 rounded-2xl shadow-lg shadow-teal-900/30 relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-4 opacity-15">
                            <Icon name="trending-up" size={80} className="text-white" />
                        </div>
                        <div className="relative z-10 flex items-end justify-between">
                            <div>
                                <p className="text-teal-200 text-[10px] font-bold tracking-widest uppercase mb-0.5">Beklenen</p>
                                <h3 className="text-3xl font-extrabold tracking-tight">₺{formatMoneyTR(totalExpected)}</h3>
                            </div>
                            <div className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm border border-white/10">
                                <p className="text-[9px] text-emerald-100 uppercase tracking-widest font-bold mb-0.5">Alınan</p>
                                <p className="text-base font-bold text-white">₺{formatMoneyTR(totalReceived)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-1">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setIncomeTab("expected")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            incomeTab === "expected"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Icon name="clock" size={14} className="text-current" />
                        Beklenen
                    </button>
                    <button
                        onClick={() => setIncomeTab("received")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            incomeTab === "received"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Icon name="check-circle" size={14} className="text-current" />
                        Alınan
                    </button>
                </div>
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
