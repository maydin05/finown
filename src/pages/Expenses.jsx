import React, { useMemo } from 'react';
import { useData } from '../context/store';
import { useViewData } from '../hooks/useViewData';
import { PaymentItem } from '../components/items/PaymentItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';
import CashFlowSummary from '../components/CashFlowSummary';
import { deletionType, sourceIssue, isSourceExcluded, paymentItemsForMonth } from '../domain/finance';

export default function Expenses({ viewDate, prevMonth, nextMonth, onOpenModal, paymentTab, setPaymentTab }) {
    const { payments, expenseSources, statusTracker, toggleTracker, editPayment, products } = useData();

    // 1. Generate recurring/one-time items from Sources
    const expenseItems = useViewData(expenseSources, statusTracker, viewDate, "expense");

    const paymentRows = useMemo(() => paymentItemsForMonth(payments, products, viewDate),
        [payments, products, viewDate]);

    // 3. Merge
    const allItems = useMemo(() => {
        return [...expenseItems, ...paymentRows].sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
    }, [expenseItems, paymentRows]);

    // 4. Calculate Totals
    const totalRemaining = allItems.filter(i => !i.isPaid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalPaid = allItems.filter(i => i.isPaid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 5. Filter for Tab
    const filteredList = allItems.filter((item) => (paymentTab === "pending" ? !item.isPaid : item.isPaid));

    const incompleteSources = expenseSources.filter(source => !isSourceExcluded(source, 'expense', statusTracker) && sourceIssue(source, 'expense'));
    const cardTrackedSources = expenseSources.filter(source => isSourceExcluded(source, 'expense', statusTracker));
    const handleToggle = async (item) => {
        try {
            if (item.recordType === 'payment') {
                if (item.isPaid) await editPayment(item.id, { isPaid: false });
                else onOpenModal('payment_confirm', item);
            } else {
                await toggleTracker(item.trackerKey, item.isPaid);
            }
        } catch (error) {
            if (item.recordType === 'payment') alert('Ödeme durumu kaydedilemedi: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-gray-900 text-white p-5 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-10 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-[11px] text-gray-400 font-medium">{viewDate.getFullYear()} Giderleri</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 rounded-2xl shadow-lg shadow-red-900/30 relative overflow-hidden">
                        <div className="absolute -right-3 -bottom-4 opacity-15">
                            <Icon name="trending-down" size={80} className="text-white" />
                        </div>
                        <div className="relative z-10 flex items-end justify-between">
                            <div>
                                <p className="text-red-200 text-[10px] font-bold tracking-widest uppercase mb-0.5">Bilinen ödemeler</p>
                                <h3 className="text-3xl font-extrabold tracking-tight">₺{formatMoneyTR(totalRemaining)}</h3>
                            </div>
                            <div className="bg-emerald-600 rounded-xl px-3 py-2 shadow-lg shadow-emerald-900/30 border border-emerald-500/50">
                                <p className="text-[9px] text-emerald-100 uppercase tracking-widest font-bold mb-0.5">Ödenen</p>
                                <p className="text-base font-bold text-white">₺{formatMoneyTR(totalPaid)}</p>
                            </div>
                        </div>
                    </div>
                    {paymentRows.filter(item => item.needsCardAmount).length > 0 && <p className="text-xs text-amber-200 mt-3" role="status">
                        {paymentRows.filter(item => item.needsCardAmount).length} kartın ekstre tutarı girilmedi; aylık toplam kesinleşmedi.
                    </p>}
                </div>
            </div>

            <CashFlowSummary onOpenModal={onOpenModal} />
            {incompleteSources.length > 0 && (
                <section className="mx-1 p-4 rounded-2xl border border-amber-200 bg-amber-50" aria-label="Bilgisi tamamlanmalı">
                    <h3 className="font-bold text-amber-900">Bilgisi tamamlanmalı ({incompleteSources.length})</h3>
                    <p className="text-xs text-amber-800 mt-1">Bu kayıtlar doğrulanana kadar ödeme toplamına dahil değil. Mevcut kayıtlar değiştirilmedi.</p>
                    <ul className="mt-3 space-y-2 text-sm">
                        {incompleteSources.map(source => <li key={source.id}>
                            <strong>{source.title}</strong> · ₺{formatMoneyTR(source.amount)}
                            <p className="text-xs text-amber-800">{sourceIssue(source, 'expense')}</p>
                        </li>)}
                    </ul>
                </section>
            )}
            {cardTrackedSources.length > 0 && <details className="mx-1 p-3 border border-gray-200 rounded-xl text-sm text-gray-600">
                <summary>Kart ekstresinden takip edilen giderler ({cardTrackedSources.length})</summary>
                <p className="text-xs mt-2">Ayrı gider olarak toplanmaz; eski kayıtlar korunur.</p>
                <ul className="mt-2">{cardTrackedSources.map(source => <li key={source.id}>{source.title}</li>)}</ul>
            </details>}
            {/* Tabs */}
            <div className="px-1">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setPaymentTab("pending")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            paymentTab === "pending"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Icon name="clock" size={14} className="text-current" />
                        Ödenecekler
                    </button>
                    <button
                        onClick={() => setPaymentTab("paid")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            paymentTab === "paid"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Icon name="check-circle" size={14} className="text-current" />
                        Ödenmişler
                    </button>
                </div>
            </div>

            <div className="px-1 min-h-[300px]">
                {filteredList.map((item, idx) => (
                    <PaymentItem
                        key={`${item.id}-${idx}`}
                        item={item}
                        onToggle={() => handleToggle(item)}
                        onEdit={(itm) => {
                            // Card payments (virtual or real) should open CardAmountModal
                            if (itm.isVirtual || itm.type === 'card' || itm.productId) {
                                onOpenModal("card_amount", itm);
                            } else {
                                // Expense sources open SourceModal
                                onOpenModal("expense", { ...itm, sourceType: 'expense' });
                            }
                        }}
                        onDelete={!item.isVirtual ? (itm) => {
                            const type = deletionType(itm);
                            if (type) onOpenModal(`delete_${type}`, itm);
                        } : null}
                        onCardNeedAmount={(row) => onOpenModal("card_amount", row)}
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
