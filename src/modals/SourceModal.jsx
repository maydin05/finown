import React from "react";
import { FormModal } from "../components/ui/FormModal";

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
    <FormModal
      onClose={onClose}
      onSave={onSave}
      title={editingItem ? `${title} Düzenle` : `${title} Ekle`}
      subtitle={
        editingItem
          ? "Kayıt bilgilerini güncelle"
          : "Yeni kaydının bilgilerini gir"
      }
      tone={isIncome ? "income" : isExpense ? "payments" : "subscriptions"}
      icon={isIncome ? "arrow-up-right" : isExpense ? "receipt" : "repeat"}
    >
      {/* Scrollable Content */}
      <div className="form-fields">
        {canFutureEdit && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Güncelleme Kapsamı
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUpdateScope("all")}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border ${
                  updateScope === "all"
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setUpdateScope("future")}
                className={`flex-1 py-2 rounded-xl font-bold text-sm border ${
                  updateScope === "future"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                Gelecek
              </button>
            </div>

            {updateScope === "future" && (
              <div className="mt-3">
                <label
                  htmlFor="sourcemodal-field-1"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Değişikliğin Başlangıç Tarihi
                </label>
                <input
                  id="sourcemodal-field-1"
                  type="date"
                  className="w-full p-3 rounded-xl border border-gray-200"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Eski kaydın bitiş tarihi <b>yeni başlangıç - 1 gün</b> olacak.
                </p>
              </div>
            )}
          </div>
        )}

        {isExpense && (
          <label className="debt-toggle">
            <input
              type="checkbox"
              checked={!!form.isDebt}
              onChange={(e) =>
                setForm((p) => ({ ...p, isDebt: e.target.checked }))
              }
            />
            <span>
              Elden borç olarak izle
              <small>
                TL planının kalan tutarı Bankalar ekranında da görünür.
                Tekrarlayan borç için bitiş tarihi gerekli.
              </small>
            </span>
          </label>
        )}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="sourcemodal-field-2"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Başlık
            </label>
            <input
              id="sourcemodal-field-2"
              type="text"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>

          {isSubscription && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abonelik Tipi
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isVariable: false }))}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    !form.isVariable
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  Sabit Tutar
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isVariable: true }))}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    form.isVariable
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-purple-200"
                  }`}
                >
                  Değişken Fatura
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="sourcemodal-field-3"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {isSubscription && form.isVariable
                ? "Beklenen Aylık Tutar (₺)"
                : "Tutar (₺)"}
            </label>
            <input
              id="sourcemodal-field-3"
              type="number"
              step="0.01"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: e.target.value }))
              }
            />
          </div>

          {!isSubscription && (
            <div>
              <label
                htmlFor="sourcemodal-field-4"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Kategori
              </label>
              <select
                id="sourcemodal-field-4"
                className="w-full p-3 rounded-xl border border-gray-200"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
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
              className={`flex-1 py-2 rounded-xl font-bold border ${
                form.type === "recurring"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Tekrarlanan
            </button>
            <button
              onClick={() => setForm((p) => ({ ...p, type: "one-time" }))}
              className={`flex-1 py-2 rounded-xl font-bold border ${
                form.type === "one-time"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Tek Seferlik
            </button>
          </div>

          {/* Billing Cycle - only for subscriptions + recurring */}
          {isSubscription && form.type === "recurring" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatura Periyodu
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: "monthly", label: "Aylık" },
                  { value: "quarterly", label: "3 Aylık" },
                  { value: "semi-annual", label: "6 Aylık" },
                  { value: "annual", label: "Yıllık" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, billingCycle: opt.value }))
                    }
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      (form.billingCycle || "monthly") === opt.value
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="sourcemodal-field-5"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {form.type === "recurring" ? "Başlangıç Tarihi" : "Tarih"}
            </label>
            <input
              id="sourcemodal-field-5"
              type="date"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          <div>
            <label
              htmlFor="sourcemodal-field-6"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {isExpense && form.isDebt && form.type === "recurring"
                ? "Bitiş Tarihi (Gerekli)"
                : "Bitiş Tarihi (Opsiyonel)"}
            </label>
            <input
              id="sourcemodal-field-6"
              type="date"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
            />
          </div>

          {isSubscription && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="sourcemodal-field-7"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ödeme Tipi
                  </label>
                  <select
                    id="sourcemodal-field-7"
                    className="w-full p-3 rounded-xl border border-gray-200"
                    value={form.paymentMethodType}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        paymentMethodType: e.target.value,
                      }))
                    }
                  >
                    <option value="bank">Banka</option>
                    <option value="manual">Manuel</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="source-payment-value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ödeme Değeri
                  </label>
                  {form.paymentMethodType === "bank" ? (
                    <select
                      id="source-payment-value"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={form.paymentMethodValue}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          paymentMethodValue: e.target.value,
                          relatedCardId: "",
                        }))
                      }
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
                      id="source-payment-value"
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={form.paymentMethodValue}
                      placeholder="Google Play vb."
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          paymentMethodValue: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="sourcemodal-field-8"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bağlı Kart (Opsiyonel)
                </label>
                <select
                  id="sourcemodal-field-8"
                  className="w-full p-3 rounded-xl border border-gray-200"
                  value={form.relatedCardId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, relatedCardId: e.target.value }))
                  }
                >
                  <option value="">Seçme</option>
                  {products
                    .filter(
                      (p) =>
                        p.type === "card" &&
                        (!form.paymentMethodValue ||
                          String(p.bankId) === String(form.paymentMethodValue)),
                    )
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
            <label
              htmlFor="sourcemodal-field-9"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kısa Not
            </label>
            <input
              id="sourcemodal-field-9"
              type="text"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </FormModal>
  );
};
