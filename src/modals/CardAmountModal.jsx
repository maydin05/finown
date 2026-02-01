import React, { useState } from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const CardAmountModal = ({ target, onClose, onSave }) => {
    const [amount, setAmount] = useState(target?.amount ? String(target.amount) : "");

    // Parse existing dueDate to YYYY-MM-DD format for input
    const getInitialDate = () => {
        if (target?.dueDate) {
            const d = new Date(target.dueDate);
            return d.toISOString().split('T')[0];
        }
        return "";
    };
    const [dueDate, setDueDate] = useState(getInitialDate());

    const handleSave = () => {
        onSave(amount, dueDate);
    };

    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Icon name="credit-card" size={20} className="text-amber-600" />
                    Kredi Kartı Ödemesi
                </h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-4">
                <p className="text-sm text-amber-900 font-bold">Bu ayın kredi kartı ödeme bilgilerini düzenleyin</p>
                <p className="text-xs text-amber-800 mt-1">
                    Kart: <span className="font-bold">{target?.title}</span>
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Son Ödeme Tarihi
                        <span className="text-xs text-gray-400 ml-1">(Bankaya göre ayarlayın)</span>
                    </label>
                    <input
                        type="date"
                        className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors mt-6"
            >
                Kaydet
            </button>
        </ModalShell>
    );
};
