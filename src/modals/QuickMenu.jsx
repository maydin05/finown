import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const QuickMenu = ({ onClose, onAction }) => {
    return (
        <ModalShell onClose={onClose}>
            <div className="relative p-7 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Decorative background gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-100/30 to-transparent rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100/50">
                            <Icon name="zap" size={22} className="text-indigo-600 fill-indigo-100" />
                        </div>
                        Hızlı İşlem
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors border border-transparent hover:border-gray-200"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Main Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3.5 mb-5">
                    {/* Gelir Ekle */}
                    <button
                        onClick={() => onAction("income")}
                        className="group relative p-4 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 text-teal-800 rounded-2xl font-bold border border-teal-100/80 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:shadow-teal-500/20 active:scale-[0.98] transition-all duration-200 overflow-hidden"
                    >
                        <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgba(20,184,166,0.15)] text-teal-600 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="trending-up" size={24} />
                        </div>
                        <span className="relative z-10 tracking-wide text-sm">Gelir Ekle</span>
                    </button>

                    {/* Gider Ekle */}
                    <button
                        onClick={() => onAction("expense")}
                        className="group relative p-4 bg-gradient-to-br from-rose-50/80 to-red-50/50 text-rose-800 rounded-2xl font-bold border border-rose-100/80 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:shadow-rose-500/20 active:scale-[0.98] transition-all duration-200 overflow-hidden"
                    >
                        <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgba(244,63,94,0.15)] text-rose-600 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="trending-down" size={24} />
                        </div>
                        <span className="relative z-10 tracking-wide text-sm">Gider Ekle</span>
                    </button>

                    {/* Abonelik Ekle */}
                    <button
                        onClick={() => onAction("subscription")}
                        className="group relative p-4 bg-gradient-to-br from-purple-50/80 to-fuchsia-50/50 text-purple-800 rounded-2xl font-bold border border-purple-100/80 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98] transition-all duration-200 overflow-hidden"
                    >
                        <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgba(168,85,247,0.15)] text-purple-600 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="monitor" size={24} />
                        </div>
                        <span className="relative z-10 tracking-wide text-sm">Abonelik Ekle</span>
                    </button>

                    {/* Banka Ekle */}
                    <button
                        onClick={() => onAction("bank")}
                        className="group relative p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 text-blue-800 rounded-2xl font-bold border border-blue-100/80 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 overflow-hidden"
                    >
                        <div className="p-3 bg-white rounded-xl shadow-[0_4px_10px_rgba(59,130,246,0.15)] text-blue-600 group-hover:scale-110 transition-transform duration-300">
                            <Icon name="building-2" size={24} />
                        </div>
                        <span className="relative z-10 tracking-wide text-sm">Banka Ekle</span>
                    </button>
                </div>

                <div className="relative z-10 space-y-3 mt-6">
                    <button
                        onClick={() => onAction("product")}
                        className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-4 rounded-2xl font-bold border border-gray-800 shadow-lg shadow-gray-900/30 hover:shadow-xl hover:shadow-gray-900/40 active:scale-[0.98] transition-all duration-200 group relative"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <Icon name="credit-card" size={20} className="text-gray-300 group-hover:text-white transition-colors" />
                            Kart / Kredi Ekle
                        </span>
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full bg-white text-gray-600 py-3.5 rounded-2xl font-bold border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:text-gray-800 transition-colors active:scale-[0.98]"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
