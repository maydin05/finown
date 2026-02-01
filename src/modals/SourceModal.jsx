import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const SourceModal = ({
    type,
    editingItem,
    form,
    setForm,
    banks,
    products,
    updateScope,
    setUpdateScope,
    effectiveDate,
    setEffectiveDate,
    onClose,
    onSave,
}) => {
    const isIncome = type === "income";
    const isExpense = type === "expense";
    const isSubscription = type === "subscription";

    const title = isIncome ? "Gelir" : isExpense ? "Gider" : "Abonelik";
    const canFutureEdit = editingItem && form.type === "recurring";

    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editingItem ? `${title} Düzenle` : `${title} Ekle`}</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            {canFutureEdit && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-600 font-medium mb-2">Güncelleme kapsamı</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setUpdateScope("all")}
                            className={`flex-1 py-2 rounded-xl font-bold text-sm border ${updateScope === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                                }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setUpdateScope("future")}
                            className={`flex-1 py-2 rounded-xl font-bold text-sm border ${updateScope === "future" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                                }`}
                        >
                            Future
                        </button>
                    </div>

                    {updateScope === "future" && (
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                            <input
                                type="date"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                                Eski kaydın endDate’i <b>effectiveDate - 1 gün</b> olacak.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                    <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={form.amount}
                        onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    />
                </div>

                {!isSubscription && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select
                            className="w-full p-3 rounded-xl border border-gray-200"
                            value={form.category}
                            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                        >
                            {isIncome ? (
                                <>
                                    <option value="salary">Maaş</option>
                                    <option value="freelance">Freelance</option>
                                </>
                            ) : (
                                <>
                                    <option value="bills">Faturalar</option>
                                    <option value="rent">Kira</option>
                                    <option value="market">Market</option>
                                    <option value="credit_card">Kredi Kartı</option>
                                    <option value="other">Diğer</option>
                                </>
                            )}
                        </select>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => setForm((p) => ({ ...p, type: "recurring" }))}
                        className={`flex-1 py-2 rounded-xl font-bold border ${form.type === "recurring" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                            }`}
                    >
                        Tekrarlanan
                    </button>
                    <button
                        onClick={() => setForm((p) => ({ ...p, type: "one-time" }))}
                        className={`flex-1 py-2 rounded-xl font-bold border ${form.type === "one-time" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                            }`}
                    >
                        Tek Seferlik
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {form.type === "recurring" ? "Başlangıç Tarihi" : "Tarih"}
                    </label>
                    <input
                        type="date"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (opsiyonel)</label>
                    <input
                        type="date"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={form.endDate}
                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    />
                </div>

                {isSubscription && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tipi</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    value={form.paymentMethodType}
                                    onChange={(e) => setForm((p) => ({ ...p, paymentMethodType: e.target.value }))}
                                >
                                    <option value="bank">Banka</option>
                                    <option value="manual">Manuel</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Değeri</label>
                                {form.paymentMethodType === "bank" ? (
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200"
                                        value={form.paymentMethodValue}
                                        onChange={(e) => setForm((p) => ({ ...p, paymentMethodValue: e.target.value }))}
                                    >
                                        <option value="">Banka Seç</option>
                                        {banks.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full p-3 rounded-xl border border-gray-200"
                                        value={form.paymentMethodValue}
                                        placeholder="Google Play vb."
                                        onChange={(e) => setForm((p) => ({ ...p, paymentMethodValue: e.target.value }))}
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bağlı Kart (opsiyonel)</label>
                            <select
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={form.relatedCardId}
                                onChange={(e) => setForm((p) => ({ ...p, relatedCardId: e.target.value }))}
                            >
                                <option value="">Seçme</option>
                                {products
                                    .filter((p) => p.type === "card")
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} (**** {c.last4Digits})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Not</label>
                    <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={form.note}
                        onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    />
                </div>

                <button
                    onClick={onSave}
                    className={`w-full py-3 rounded-xl font-bold text-white ${isIncome ? "bg-teal-600 hover:bg-teal-700" : isExpense ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"
                        }`}
                >
                    Kaydet
                </button>
            </div>
        </ModalShell>
    );
};
