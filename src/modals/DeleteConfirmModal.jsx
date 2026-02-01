import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const DeleteConfirmModal = ({ deletingItem, onClose, onConfirm }) => {
    const isBankDelete = deletingItem?.type === "bank";
    const meta = deletingItem?.meta || {};

    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Silme Onayı</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="text-sm text-gray-600 mb-6">
                {isBankDelete ? (
                    <>
                        <span className="font-bold">{deletingItem?.data?.name}</span> bankasını silmek istiyor musun?

                        <div className="mt-3 text-xs bg-red-50 border border-red-100 p-3 rounded-xl text-red-800">
                            Bu işlemle birlikte:
                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li>
                                    <b>{meta.productCount || 0}</b> bağlı kart/kredi silinecek
                                </li>
                                <li>
                                    <b>{meta.paymentsCount || 0}</b> ödeme satırı (loan/card) temizlenecek
                                </li>
                                <li>
                                    <b>{meta.subscriptionsCount || 0}</b> aboneliğin banka ödeme yöntemi “manuel”e çevrilecek
                                </li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <>
                        <span className="font-bold">{deletingItem?.data?.title}</span> kaydını silmek istiyor musun?
                    </>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    Vazgeç
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700"
                >
                    Sil
                </button>
            </div>
        </ModalShell>
    );
};
