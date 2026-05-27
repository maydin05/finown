import React, { useState, useEffect } from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export const PaymentEntryModal = ({
    item,
    onClose,
    onSave,
}) => {
    const expected = Number(item.expectedAmount || item.amount || 0);
    
    const [amount, setAmount] = useState(item.actualAmount !== null && item.actualAmount !== undefined ? String(item.actualAmount) : String(expected));
    const [paidDate, setPaidDate] = useState(item.paidDate || new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(item.note || '');

    const typedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const diff = typedAmount - expected;

    const handleSave = () => {
        const finalAmount = parseFloat(amount.replace(',', '.')) || 0;
        onSave(finalAmount, paidDate, note);
    };

    return (
        <ModalShell onClose={onClose}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold">Ödeme Tutarı Gir</h3>
                    <p className="text-xs text-purple-600 font-semibold">{item.title}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2">
                    <Icon name="x" size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Expected Info Card */}
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                        <span className="text-[10px] text-purple-700 tracking-wider font-extrabold uppercase">Beklenen Aylık Tutar</span>
                        <p className="text-xl font-black text-purple-900">₺{formatMoneyTR(expected)}</p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Icon name="calculator" size={20} />
                    </div>
                </div>

                {/* Actual Amount Input */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Ödenen Gerçek Tutar (₺)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold text-lg">₺</span>
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            autoFocus
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-600 focus:outline-none text-xl font-bold tracking-tight text-gray-900"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {/* Dynamic Diff comparison badge */}
                    {amount !== "" && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                            {diff === 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                                    <Icon name="check" size={12} className="text-gray-500" />
                                    Beklenen tutar ile aynı
                                </span>
                            ) : diff > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                                    <Icon name="trending-up" size={12} className="text-red-600" />
                                    Beklenenden ₺{formatMoneyTR(diff)} daha fazla (Artış ↑)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    <Icon name="trending-down" size={12} className="text-emerald-600" />
                                    Beklenenden ₺{formatMoneyTR(Math.abs(diff))} daha az (Tasarruf ↓)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Paid Date Input */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Ödeme Tarihi</label>
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full p-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-600 focus:outline-none font-medium text-gray-900"
                            value={paidDate}
                            onChange={(e) => setPaidDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Period Note Input */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Dönem Notu (Opsiyonel)</label>
                    <textarea
                        rows="2"
                        placeholder="Örn: Klimadan dolayı yüksek tüketim, indirim uygulandı"
                        className="w-full p-3.5 rounded-2xl border-2 border-purple-100 focus:border-purple-600 focus:outline-none text-sm font-medium text-gray-800 placeholder-gray-400"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0 flex gap-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all border border-gray-200"
                >
                    Vazgeç
                </button>
                <button
                    onClick={handleSave}
                    disabled={!amount}
                    className="flex-1 py-3.5 rounded-2xl font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-lg shadow-purple-200 transition-all"
                >
                    Ödendi Olarak Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
