import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const QuickMenu = ({ onClose, onAction }) => {
    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Hızlı İşlem</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => {
                        onAction("income");
                    }}
                    className="p-3 bg-teal-50 text-teal-700 rounded-xl font-bold border border-teal-100 flex flex-col items-center gap-2"
                >
                    <Icon name="trending-up" size={24} className="text-teal-700" /> Gelir Ekle
                </button>

                <button
                    onClick={() => {
                        onAction("expense");
                    }}
                    className="p-3 bg-red-50 text-red-700 rounded-xl font-bold border border-red-100 flex flex-col items-center gap-2"
                >
                    <Icon name="trending-down" size={24} className="text-red-700" /> Gider Ekle
                </button>

                <button
                    onClick={() => {
                        onAction("subscription");
                    }}
                    className="p-3 bg-purple-50 text-purple-700 rounded-xl font-bold border border-purple-100 flex flex-col items-center gap-2"
                >
                    <Icon name="monitor" size={24} className="text-purple-700" /> Abonelik Ekle
                </button>

                <button
                    onClick={() => {
                        onAction("bank");
                    }}
                    className="p-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-100 flex flex-col items-center gap-2"
                >
                    <Icon name="building-2" size={24} className="text-blue-700" /> Banka Ekle
                </button>
            </div>

            <button
                onClick={() => {
                    onAction("product");
                }}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
            >
                <span className="inline-flex items-center justify-center gap-2">
                    <Icon name="credit-card" size={18} className="text-white" />
                    Kart / Kredi Ekle
                </span>
            </button>

            <button
                onClick={onClose}
                className="w-full mt-3 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-colors"
            >
                Kapat
            </button>
        </ModalShell>
    );
};
