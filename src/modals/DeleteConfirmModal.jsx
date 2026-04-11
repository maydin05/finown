import React, { useState } from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';
import { formatMoneyTR } from '../utils';

export const DeleteConfirmModal = ({ deletingItem, onClose, onConfirm, onSoftDelete, onReactivate }) => {
    const isBankDelete = deletingItem?.type === "bank";
    const isSubscription = deletingItem?.type === "subscription";
    const isArchived = isSubscription && deletingItem?.data?.isArchived;
    const meta = deletingItem?.meta || {};

    const [deleteMode, setDeleteMode] = useState(null); // null | 'soft' | 'hard'

    const itemTitle = deletingItem?.data?.title || deletingItem?.data?.name || "Bu kayıt";

    // Subscription: show reactivate option if already archived
    if (isArchived) {
        return (
            <ModalShell onClose={onClose}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon name="archive-restore" size={20} className="text-emerald-600" />
                        Arşivlenmiş Abonelik
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="x" size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="font-extrabold text-gray-900 text-base mb-1">{itemTitle}</p>
                        <p className="text-xs text-gray-500">Bu abonelik şu anda arşivde. Ne yapmak istersiniz?</p>
                    </div>

                    <button
                        onClick={() => onReactivate && onReactivate()}
                        className="w-full py-3.5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <Icon name="rotate-ccw" size={16} /> Tekrar Aktif Et
                    </button>

                    <button
                        onClick={() => onConfirm && onConfirm()}
                        className="w-full py-3 rounded-2xl font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Icon name="trash-2" size={14} /> Kalıcı Olarak Sil
                    </button>

                    <p className="text-[10px] text-center text-gray-400">
                        Kalıcı silme işlemi tüm geçmiş kayıtları da siler ve geri alınamaz.
                    </p>
                </div>
            </ModalShell>
        );
    }

    // Subscription delete: show soft/hard options
    if (isSubscription && deleteMode === null) {
        return (
            <ModalShell onClose={onClose}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon name="alert-triangle" size={20} className="text-amber-500" />
                        Abonelik Silme
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="x" size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-3">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="font-extrabold text-gray-900 text-base mb-1">{itemTitle}</p>
                        {deletingItem?.data?.amount && (
                            <p className="text-sm text-gray-500">Aylık ₺{formatMoneyTR(deletingItem.data.amount)}</p>
                        )}
                    </div>

                    <p className="text-sm text-gray-600 px-1">Bu aboneliği nasıl silmek istersiniz?</p>

                    {/* Soft Delete Option */}
                    <button
                        onClick={() => setDeleteMode('soft')}
                        className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <Icon name="archive" size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Arşivle (Önerilen)</p>
                                <p className="text-xs text-gray-500 mt-0.5">Abonelik listeden kaldırılır ama geçmiş ödeme kayıtları korunur. İstediğiniz zaman tekrar aktif edebilirsiniz.</p>
                            </div>
                        </div>
                    </button>

                    {/* Hard Delete Option */}
                    <button
                        onClick={() => setDeleteMode('hard')}
                        className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50/50 transition-all group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                <Icon name="trash-2" size={20} className="text-red-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Kalıcı Olarak Sil</p>
                                <p className="text-xs text-gray-500 mt-0.5">Abonelik ve tüm geçmiş kayıtları tamamen silinir. Bu işlem geri alınamaz.</p>
                            </div>
                        </div>
                    </button>
                </div>
            </ModalShell>
        );
    }

    // Subscription: Confirm soft delete
    if (isSubscription && deleteMode === 'soft') {
        return (
            <ModalShell onClose={onClose}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon name="archive" size={20} className="text-amber-500" />
                        Arşivleme Onayı
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="x" size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="text-sm text-amber-800">
                            <span className="font-bold">{itemTitle}</span> arşivlenecek.
                        </p>
                        <ul className="text-xs text-amber-700 mt-2 space-y-1">
                            <li className="flex items-center gap-1.5">
                                <Icon name="check" size={12} className="text-emerald-600" /> Geçmiş ödeme kayıtları korunur
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Icon name="check" size={12} className="text-emerald-600" /> İstediğiniz zaman tekrar aktif edebilirsiniz
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Icon name="check" size={12} className="text-emerald-600" /> Aylık toplam tutardan düşülür
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setDeleteMode(null)}
                            className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Geri
                        </button>
                        <button
                            onClick={() => onSoftDelete && onSoftDelete()}
                            className="flex-1 py-3 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-md"
                        >
                            Arşivle
                        </button>
                    </div>
                </div>
            </ModalShell>
        );
    }

    // Subscription: Confirm hard delete
    if (isSubscription && deleteMode === 'hard') {
        return (
            <ModalShell onClose={onClose}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Icon name="alert-triangle" size={20} className="text-red-600" />
                        Kalıcı Silme Onayı
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon name="x" size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <p className="text-sm text-red-800">
                            <span className="font-bold">{itemTitle}</span> kalıcı olarak silinecek.
                        </p>
                        <ul className="text-xs text-red-700 mt-2 space-y-1">
                            <li className="flex items-center gap-1.5">
                                <Icon name="x" size={12} className="text-red-500" /> Tüm geçmiş ödeme kayıtları silinir
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Icon name="x" size={12} className="text-red-500" /> Bu işlem geri alınamaz
                            </li>
                        </ul>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setDeleteMode(null)}
                            className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Geri
                        </button>
                        <button
                            onClick={() => onConfirm && onConfirm()}
                            className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                        >
                            Kalıcı Sil
                        </button>
                    </div>
                </div>
            </ModalShell>
        );
    }

    // Default: Non-subscription delete (bank, product, etc.)
    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Icon name="alert-triangle" size={20} className="text-red-500" />
                    Silme Onayı
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Icon name="x" size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="p-4">
                <div className="text-sm text-gray-600 mb-6">
                    {isBankDelete ? (
                        <>
                            <p className="mb-3">
                                <span className="font-bold text-gray-900">{deletingItem?.data?.name}</span> bankasını silmek istiyor musun?
                            </p>
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-800 text-xs">
                                <p className="font-bold mb-2">Bu işlemle birlikte:</p>
                                <ul className="space-y-1.5">
                                    <li className="flex items-center gap-2">
                                        <Icon name="credit-card" size={12} className="text-red-500 shrink-0" />
                                        <b>{meta.productCount || 0}</b>&nbsp;bağlı kart/kredi silinecek
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Icon name="receipt" size={12} className="text-red-500 shrink-0" />
                                        <b>{meta.paymentsCount || 0}</b>&nbsp;ödeme satırı temizlenecek
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Icon name="monitor" size={12} className="text-red-500 shrink-0" />
                                        <b>{meta.subscriptionsCount || 0}</b>&nbsp;aboneliğin ödeme yöntemi "manuel"e çevrilecek
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <p>
                            <span className="font-bold text-gray-900">{itemTitle}</span> kaydını silmek istiyor musun?
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                    >
                        Sil
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
