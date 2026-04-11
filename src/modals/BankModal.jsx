import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const BankModal = ({
    editingItem,
    newBankName,
    setNewBankName,
    newBankColor,
    setNewBankColor,
    onClose,
    onSave,
}) => {
    return (
        <ModalShell onClose={onClose}>
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-bold">{editingItem ? "Banka Düzenle" : "Yeni Banka Ekle"}</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-2">
                    <Icon name="x" size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                        <input
                            type="text"
                            className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            autoFocus
                            placeholder="Örn: İş Bankası"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tema Rengi</label>
                        <div className="flex gap-3 flex-wrap">
                            {[
                                "from-blue-600 to-blue-800",
                                "from-green-600 to-green-800",
                                "from-red-600 to-red-800",
                                "from-purple-600 to-purple-800",
                                "from-orange-500 to-orange-700",
                                "from-gray-700 to-gray-900",
                                "from-emerald-500 to-teal-700",
                                "from-rose-500 to-pink-700"
                            ].map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewBankColor(color)}
                                    className={`w-9 h-9 rounded-full bg-gradient-to-br transition-all duration-200 ${color} ${
                                        newBankColor === color 
                                            ? "ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md" 
                                            : "hover:scale-105 shadow-sm opacity-90"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                    onClick={onSave}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                >
                    Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
