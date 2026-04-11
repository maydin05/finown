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
            <div className="relative p-7 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Decorative background gradients */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-200/40 to-orange-100/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-amber-100/30 to-transparent rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 flex items-center justify-center shadow-sm border border-amber-100/50">
                            <Icon name="credit-card" size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Kredi Kartı Ödemesi</h3>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">Ödeme detaylarını güncelleyin</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <div className="relative z-10 bg-gradient-to-br from-amber-500 to-orange-500 p-5 rounded-2xl mb-6 text-white shadow-lg shadow-amber-500/20 overflow-hidden">
                    {/* Add a generic geometric pattern using CSS for texture without external requests if possible, 
                        or a subtle linear gradient angle overlay */}
                    <div className="absolute inset-0 bg-white/10 opacity-30 transform -skew-x-12 translate-x-12"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1 opacity-90">
                                <Icon name="credit-card" size={14} className="text-amber-100" />
                                <span className="text-amber-100 text-xs font-semibold uppercase tracking-wider">KART BİLGİSİ</span>
                            </div>
                            <p className="text-lg font-bold tracking-wide drop-shadow-sm">{target?.title || 'Bilinmiyor'}</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-5">
                    <div className="group">
                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-amber-600">
                            Tutar (₺)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-400 font-semibold text-lg">₺</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full pl-10 border border-gray-200 bg-gray-50 text-gray-900 text-lg font-semibold rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white block p-3.5 transition-all outline-none"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="flex flex-col text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-amber-600">
                            Son Ödeme Tarihi
                            <span className="text-xs text-gray-400 font-medium mt-0.5 group-focus-within:text-amber-500/70 transition-colors">Bankanızın belirlediği hesap kesimine göre</span>
                        </label>
                         <div className="relative">
                            <input
                                type="date"
                                className="w-full border border-gray-200 bg-gray-50 text-gray-900 font-medium rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white block p-3.5 transition-all outline-none"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    className="relative z-10 w-full mt-8 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 rounded-xl px-5 py-4 text-center font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 group"
                >
                    <Icon name="check" size={20} className="opacity-90 group-hover:scale-110 transition-transform" />
                    Bilgileri Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
