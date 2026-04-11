import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR, formatDateTR } from '../utils';

export const PaymentConfirmModal = ({ payment, banks, products, onClose, onConfirm }) => {
    // Find related product/card info
    const product = products?.find(p => p.id == payment?.productId);
    const bank = banks?.find(b => b.id == product?.bankId);

    const itemDate = payment?.dueDate ? new Date(payment.dueDate) : new Date();
    const today = new Date();
    const daysUntil = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24));

    // Calculate remaining limit if it's a credit card
    const isCard = payment?.type === 'card' || product?.type === 'card';
    const limit = product?.limit || 0;
    const paymentAmount = Number(payment?.amount) || 0;

    return (
        <ModalShell onClose={onClose}>
            <div className="relative p-7 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Decorative ambient glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-400/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-center mb-6">
                    <h3 className="text-xl font-extrabold flex items-center gap-2.5 text-gray-900 tracking-tight">
                        <div className="bg-green-100 p-1.5 rounded-full shadow-sm border border-green-200">
                            <Icon name="check-circle" size={24} className="text-green-600" />
                        </div>
                        Ödeme Onayı
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors border border-gray-100"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Amount Card */}
                <div className="relative z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 rounded-3xl mb-6 shadow-xl shadow-gray-900/20 border border-gray-700/50 overflow-hidden group">
                    {/* Inner styling */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mt-10 -mr-10 transition-transform group-hover:scale-110 duration-700 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                            <Icon name="credit-card" size={26} className="text-white/90" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-white/95 tracking-wide">{payment?.title}</h4>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-0.5">{bank?.name || 'Diğer'}</p>
                        </div>
                    </div>

                    <div className="text-center py-5 border-t border-white/10 relative z-10 bg-white/5 rounded-2xl backdrop-blur-sm border-b border-r border-white/5 shadow-sm">
                        <p className="text-gray-400 text-xs font-bold mb-1 tracking-widest uppercase">ÖDENECEK TUTAR</p>
                        <p className="text-4xl font-black tracking-tight text-white drop-shadow-md">₺{formatMoneyTR(paymentAmount)}</p>
                    </div>
                </div>

                {/* Details List */}
                <div className="relative z-10 space-y-3 mb-8">
                    {[
                        { icon: 'calendar', label: 'Son Ödeme Tarihi', value: formatDateTR(itemDate), show: true },
                        { 
                            icon: 'clock', 
                            label: 'Kalan Gün', 
                            value: daysUntil < 0 ? `${Math.abs(daysUntil)} gün gecikmiş` : daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`, 
                            valueColor: daysUntil < 0 ? 'text-red-600 font-bold bg-red-50/80 px-2.5 py-0.5 rounded-md border border-red-100' : daysUntil <= 3 ? 'text-orange-600 font-bold bg-orange-50/80 px-2.5 py-0.5 rounded-md border border-orange-100' : 'text-gray-700 font-semibold bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200',
                            show: true 
                        },
                        { icon: 'trending-up', label: 'Kart Limiti', value: `₺${formatMoneyTR(limit)}`, show: isCard && limit > 0 },
                        { icon: 'percent', label: 'Kullanım Oranı', value: `%${limit > 0 ? Math.round((paymentAmount / limit) * 100) : 0}`, show: isCard && limit > 0 },
                        { icon: 'info', label: 'Açıklama', value: payment?.subtitle, show: !!payment?.subtitle }
                    ].filter(item => item.show).map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-colors shadow-sm focus-within:ring-2 focus-within:ring-gray-200">
                            <span className="text-gray-500 text-sm font-semibold flex items-center gap-3">
                                <span className="p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg">
                                    <Icon name={row.icon} size={15} className="text-gray-400" />
                                </span>
                                {row.label}
                            </span>
                            <span className={`text-sm text-right ${row.valueColor || 'font-bold text-gray-800'}`}>{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="relative z-10 flex gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border-2 border-gray-200 text-gray-500 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 transition-all active:scale-[0.98]"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={() => onConfirm(payment)}
                        className="flex-[1.8] flex bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/20 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/30 hover:shadow-lg transition-all items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        <Icon name="check-circle" size={20} className="text-white" />
                        İşlemi Onayla
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
