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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Icon name="check-circle" size={20} className="text-green-600" />
                    Ödeme Onayı
                </h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <Icon name="credit-card" size={24} className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">{payment?.title}</h4>
                        {bank && <p className="text-gray-400 text-xs">{bank.name}</p>}
                    </div>
                </div>

                <div className="text-center py-4 border-t border-white/10">
                    <p className="text-gray-400 text-xs mb-1">Ödenecek Tutar</p>
                    <p className="text-3xl font-bold">₺{formatMoneyTR(paymentAmount)}</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                        <Icon name="calendar" size={14} className="text-gray-400" />
                        Son Ödeme Tarihi
                    </span>
                    <span className="font-medium text-gray-900">{formatDateTR(itemDate)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                        <Icon name="clock" size={14} className="text-gray-400" />
                        Kalan Gün
                    </span>
                    <span className={`font-medium ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 3 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {daysUntil < 0 ? `${Math.abs(daysUntil)} gün gecikmiş` : daysUntil === 0 ? 'Bugün' : `${daysUntil} gün`}
                    </span>
                </div>

                {isCard && limit > 0 && (
                    <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm flex items-center gap-2">
                                <Icon name="trending-up" size={14} className="text-gray-400" />
                                Kart Limiti
                            </span>
                            <span className="font-medium text-gray-900">₺{formatMoneyTR(limit)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500 text-sm flex items-center gap-2">
                                <Icon name="percent" size={14} className="text-gray-400" />
                                Kullanım Oranı
                            </span>
                            <span className="font-medium text-gray-900">
                                %{limit > 0 ? Math.round((paymentAmount / limit) * 100) : 0}
                            </span>
                        </div>
                    </>
                )}

                {payment?.subtitle && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                            <Icon name="info" size={14} className="text-gray-400" />
                            Açıklama
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{payment.subtitle}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    Vazgeç
                </button>
                <button
                    onClick={() => onConfirm(payment)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Icon name="check" size={18} className="text-white" />
                    Ödedim
                </button>
            </div>
        </ModalShell>
    );
};
