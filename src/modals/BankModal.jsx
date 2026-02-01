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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">{editingItem ? "Banka Düzenle" : "Yeni Banka Ekle"}</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                    <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema Rengi</label>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            "from-blue-600 to-blue-800",
                            "from-green-600 to-green-800",
                            "from-red-600 to-red-800",
                            "from-purple-600 to-purple-800",
                            "from-orange-500 to-orange-700",
                            "from-gray-700 to-gray-900",
                        ].map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setNewBankColor(color)}
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} ${newBankColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={onSave}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors mt-2"
                >
                    Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
