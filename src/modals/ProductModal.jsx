import React from 'react';
import { ModalShell } from '../components/ui/Modal';
import { Icon } from '../components/ui/Icon';

export const ProductModal = ({
    editingItem,
    newProduct,
    setNewProduct,
    banks,
    products,
    onClose,
    onSave,
}) => {
    return (
        <ModalShell onClose={onClose}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">{editingItem ? "Ürün Düzenle" : "Kart/Kredi Ekle"}</h3>
                <button onClick={onClose}>
                    <Icon name="x" size={24} className="text-gray-400" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka</label>
                    <select
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={newProduct.bankId}
                        onChange={(e) => setNewProduct((p) => ({ ...p, bankId: e.target.value }))}
                    >
                        <option value="">Seçiniz</option>
                        {banks.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setNewProduct((p) => ({ ...p, type: "card" }))}
                        className={`flex-1 py-2 rounded-xl font-bold border ${newProduct.type === "card" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                            }`}
                    >
                        Kart
                    </button>
                    <button
                        onClick={() => setNewProduct((p) => ({ ...p, type: "loan" }))}
                        className={`flex-1 py-2 rounded-xl font-bold border ${newProduct.type === "loan" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-200"
                            }`}
                    >
                        Kredi
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                    <input
                        type="text"
                        className="w-full p-3 rounded-xl border border-gray-200"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    />
                </div>

                {newProduct.type === "card" ? (
                    <>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewProduct((p) => ({ ...p, cardType: "physical" }))}
                                className={`flex-1 py-2 rounded-xl font-bold border ${newProduct.cardType === "physical" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                                    }`}
                            >
                                Fiziki
                            </button>
                            <button
                                onClick={() => setNewProduct((p) => ({ ...p, cardType: "virtual" }))}
                                className={`flex-1 py-2 rounded-xl font-bold border ${newProduct.cardType === "virtual" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200"
                                    }`}
                            >
                                Sanal
                            </button>
                        </div>
                        {/* ✅ Sanal seçilince: bağlı olduğu fiziki kartı seçtir */}
                        {newProduct.type === "card" && newProduct.cardType === "virtual" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bağlı Olduğu Fiziki Kart
                                </label>

                                <select
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    value={newProduct.parentCardId || ""}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, parentCardId: e.target.value }))}
                                >
                                    <option value="">Fiziki Kart Seçiniz</option>

                                    {(products || [])
                                        .filter(
                                            (p) =>
                                                p.type === "card" &&
                                                p.cardType === "physical" &&
                                                String(p.bankId) === String(newProduct.bankId)
                                        )
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} (**** {c.last4Digits})
                                            </option>
                                        ))}
                                </select>

                                <p className="text-[11px] text-gray-500 mt-1">
                                    Sanal kart, seçtiğiniz fiziki karta bağlı olarak sadece bilgilendirme amaçlı tutulur.
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Son 4 Hane</label>
                                <input
                                    type="text"
                                    maxLength="4"
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    value={newProduct.last4Digits}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, last4Digits: e.target.value }))}
                                />
                            </div>

                            {newProduct.cardType === "physical" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 rounded-xl border border-gray-200"
                                        value={newProduct.limit}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, limit: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        {newProduct.cardType === "physical" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kesim Günü</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 rounded-xl border border-gray-200"
                                        value={newProduct.cutoffDay}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, cutoffDay: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Son Ödeme Günü</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 rounded-xl border border-gray-200"
                                        value={newProduct.paymentDueDay}
                                        onChange={(e) => setNewProduct((p) => ({ ...p, paymentDueDay: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Taksit (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    value={newProduct.installmentAmount}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, installmentAmount: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kaç Taksit</label>
                                <input
                                    type="number"
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    value={newProduct.totalInstallments}
                                    onChange={(e) => setNewProduct((p) => ({ ...p, totalInstallments: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">İlk Taksit Ödeme Tarihi</label>
                            <input
                                type="date"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                value={newProduct.firstPaymentDate}
                                onChange={(e) => setNewProduct((p) => ({ ...p, firstPaymentDate: e.target.value }))}
                            />
                        </div>

                        <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            Toplam kredi otomatik hesaplanır: <b>(aylık taksit × taksit sayısı)</b>.
                            Geçmiş taksitler otomatik “ödendi” işaretlenecek.
                        </div>
                    </>
                )}

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
