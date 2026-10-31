// Development-only component harness. All records below are synthetic; no login or API writes.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CashFlowPanel } from '../src/components/CashFlowSummary';
import Expenses from '../src/pages/Expenses';
import { DataContext } from '../src/context/store';
import { PaymentItem } from '../src/components/items/PaymentItem';
import { CardAmountModal } from '../src/modals/CardAmountModal';
import { paymentItemsForMonth } from '../src/domain/finance';
import '../src/index.css';

const products = [{ id: 9001, type: 'card', name: 'Örnek kart', paymentDueDay: 5 }];
export function Preview() {
    const [payments, setPayments] = useState([{ id: 9002, type: 'loan', title: 'Örnek taksit', dueDate: '2026-11-01', amount: 1000, isPaid: false }]);
    const [target, setTarget] = useState(null);
    const [paymentTab, setPaymentTab] = useState('pending');
    const [viewDate, setViewDate] = useState(new Date(2026, 10, 1));
    const [lastAction, setLastAction] = useState('');
    const data = { products, payments, expenseSources: [], statusTracker: {}, subscriptionPayments: [], toggleTracker: async () => {}, editPayment: async () => {}, incomeSources: [{ id: 9003, title: 'Örnek gelir', type: 'recurring', startDate: '2026-01-03', dayOfMonth: 3, amount: 15000 }],
        subscriptionSources: [{ id: 9004, title: 'Örnek kart aboneliği', type: 'recurring', startDate: '2026-01-02', dayOfMonth: 2, amount: 500, relatedCardId: 9001 }] };
    const card = paymentItemsForMonth(payments, products, new Date(2026, 10, 1)).find(item => item.type === 'card');
    const fullPage = new URLSearchParams(window.location.search).has('full');
    const openModal = (type, item) => { setLastAction(type); if (type === 'card_amount') setTarget(item); };
    return <main className="max-w-md mx-auto bg-gray-50 min-h-screen px-3 py-5">
        <p className="text-xs text-gray-500 mb-4">Geliştirme önizlemesi · yalnız örnek veriler</p>
        <output data-testid="last-action">{lastAction}</output>
        {fullPage ? <DataContext.Provider value={data}><Expenses viewDate={viewDate} prevMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} nextMonth={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} onOpenModal={openModal} paymentTab={paymentTab} setPaymentTab={setPaymentTab} /></DataContext.Provider> : <>
        <CashFlowPanel data={data} today={new Date(2026, 9, 31)} onEnterStatement={setTarget} />
        <h2 className="font-bold my-4">Ekstre satırı</h2>
        <PaymentItem item={card} onEdit={setTarget} onCardNeedAmount={setTarget} onToggle={() => {}} />
        </>}
        {target && <CardAmountModal target={target} onClose={() => setTarget(null)} onSave={(amount, dueDate) => {
            setPayments(previous => [...previous.filter(payment => payment.type !== 'card'), { id: 9005, title: 'Örnek kart', productId: 9001, type: 'card', amount: Number(amount), dueDate, isPaid: false }]);
            setTarget(null);
        }} />}
    </main>;
}
createRoot(document.getElementById('root')).render(<Preview />);
