import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useViewData } from '../hooks/useViewData';
import { PaymentItem } from '../components/items/PaymentItem';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export default function Expenses({ viewDate, prevMonth, nextMonth, onOpenModal, paymentTab, setPaymentTab }) {
    const { payments, expenseSources, statusTracker, toggleTracker, editPayment, addPayment, products } = useData();

    // 1. Generate recurring/one-time items from Sources
    const expenseItems = useViewData(expenseSources, statusTracker, viewDate, "expense");

    // 2. Filter actual Payment rows (Loans, Card Payments, Manual additions)
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const paymentRows = useMemo(() => {
        return (payments || []).filter((p) => {
            const d = new Date(p.dueDate || p.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }, [payments, currentMonth, currentYear]);

    // 2b. Generate Placeholder Card Payments
    const cardPlaceholders = useMemo(() => {
        if (!products) return [];
        // Filter for credit cards
        const cards = products.filter(p => p.type === 'card' && p.paymentDueDay);

        const placeholders = [];
        cards.forEach(card => {
            // Check if we already have a payment for this card in this month
            // Match by productId (or title match?) productId is safer.
            const exists = paymentRows.find(p => p.productId === card.id || p.productId === String(card.id));

            if (!exists) {
                // Generate a placeholder
                // Date: currentYear, currentMonth, card.paymentDueDay
                const d = new Date(currentYear, currentMonth, card.paymentDueDay);
                d.setHours(12, 0, 0, 0); // Noon to avoid timezone edge cases

                placeholders.push({
                    id: `virtual_${card.id}`, // Virtual ID
                    productId: card.id,
                    title: card.name,
                    subtitle: "Kredi Kartı Ödemesi",
                    amount: 0,
                    dueDate: d.toISOString(),
                    isPaid: false,
                    type: "card", // Identify as card payment
                    isVirtual: true,
                    isManual: true // Treat as payment row
                });
            }
        });
        return placeholders;
    }, [products, paymentRows, currentMonth, currentYear]);

    // 3. Merge
    const allItems = useMemo(() => {
        return [...expenseItems, ...paymentRows, ...cardPlaceholders].sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
    }, [expenseItems, paymentRows, cardPlaceholders]);

    // 4. Calculate Totals
    const totalRemaining = allItems.filter(i => !i.isPaid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalPaid = allItems.filter(i => i.isPaid).reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 5. Filter for Tab
    const filteredList = allItems.filter((item) => (paymentTab === "pending" ? !item.isPaid : item.isPaid));

    const handleToggle = (item) => {
        // If item is already paid, just toggle back (Geri Al)
        if (item.isPaid) {
            if (item.type === "loan" || item.productId || item.isManual === undefined) {
                editPayment(item.id, { isPaid: false });
            } else {
                const key = `${item.id}_${currentMonth}_${currentYear}`;
                toggleTracker(key, item.isPaid);
            }
            return;
        }

        // Item is not paid - show confirmation modal for payments
        if (item.type === "loan" || item.productId || item.isManual === undefined || item.type === 'card') {
            // It's a payment row - show confirmation modal
            onOpenModal("payment_confirm", item);
        } else {
            // It's a source item (recurring/one-time expense) - direct toggle
            const key = `${item.id}_${currentMonth}_${currentYear}`;
            toggleTracker(key, item.isPaid);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-gray-900 text-white p-6 rounded-b-3xl shadow-lg -mx-4 -mt-4 pt-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={prevMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-left" size={20} className="text-white" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{viewDate.toLocaleString("tr-TR", { month: "long" })}</h2>
                            <span className="text-xs text-gray-400 font-medium">{viewDate.getFullYear()} Giderleri</span>
                        </div>
                        <button onClick={nextMonth} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                            <Icon name="chevron-right" size={20} className="text-white" />
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl shadow-lg">
                            <p className="text-red-100 text-xs font-medium mb-1">Ödenecek</p>
                            <h3 className="text-2xl font-bold">₺{formatMoneyTR(totalRemaining)}</h3>
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-2xl shadow-lg">
                            <p className="text-green-100 text-xs font-medium mb-1">Ödenen</p>
                            <h3 className="text-2xl font-bold">₺{formatMoneyTR(totalPaid)}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-1 rounded-xl border border-gray-200 flex mx-1 shadow-sm">
                <button
                    onClick={() => setPaymentTab("pending")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentTab === "pending" ? "bg-gray-100 text-gray-900" : "text-gray-400"
                        }`}
                >
                    Ödenecekler
                </button>
                <button
                    onClick={() => setPaymentTab("paid")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${paymentTab === "paid" ? "bg-green-50 text-green-700" : "text-gray-400"
                        }`}
                >
                    Ödenmişler
                </button>
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
                        onDelete={(itm) => onOpenModal("delete_expense", itm)}
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
