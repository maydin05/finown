import {normalizeStatementMonth} from "../domain/cardStatements";
import React from "react";
import { newLoanPlan } from "../domain/plans";
import { formatDateTR, formatMoneyTR } from "../utils";
import { FormModal } from "../components/ui/FormModal";

export const ProductModal = ({
  editingItem,
  newProduct,
  setNewProduct,
  banks,
  products,
  onClose,
  onSave,
}) => {
  const [statementYear='',statementMonth='']=String(newProduct.firstStatementMonth || '').split('-');
  const currentYear=new Date().getFullYear();
  const years=[...new Set([...Array.from({length:41},(_,i)=>String(currentYear-20+i)),...(statementYear ? [statementYear] : [])])].sort();
  const setStatementPart=(year,month)=>setNewProduct(p=>({...p,firstStatementMonth:year || month ? `${year}-${month}` : ''}));
  let preview = [];
  if (!editingItem && newProduct.type === "loan") {
    try {
      preview = newLoanPlan(newProduct);
    } catch {
      /* Show preview once the required values are complete. */
    }
  }
  return (
    <FormModal
      onClose={onClose}
      onSave={() => {
        if(newProduct.type==='card' && newProduct.cardType!=='virtual')normalizeStatementMonth(newProduct.firstStatementMonth);
        return onSave();
      }}
      title={editingItem ? "Ürün Düzenle" : "Kart/Kredi Ekle"}
      subtitle="Banka ve ürün bilgileri"
      tone={newProduct.type === "loan" ? "payments" : "banks"}
      icon={newProduct.type === "loan" ? "landmark" : "credit-card"}
    >
      {/* Scrollable Content */}
      <div className="form-fields">
        <div className="space-y-4">
          {editingItem && newProduct.type === "loan" && (
            <p className="form-context text-sm">
              Mevcut taksitlerin tarih ve durumlarını korumak için bu formda
              yalnız banka ve kredi adını düzenleyebilirsin.
            </p>
          )}
          <div>
            <label
              htmlFor="productmodal-field-1"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Banka
            </label>
            <select
              id="productmodal-field-1"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={newProduct.bankId}
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, bankId: e.target.value }))
              }
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
              disabled={!!editingItem}
              onClick={() => setNewProduct((p) => ({ ...p, type: "card" }))}
              className={`flex-1 py-2 rounded-xl font-bold border ${
                newProduct.type === "card"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Kart
            </button>
            <button
              disabled={!!editingItem}
              onClick={() => setNewProduct((p) => ({ ...p, type: "loan" }))}
              className={`flex-1 py-2 rounded-xl font-bold border ${
                newProduct.type === "loan"
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Kredi
            </button>
          </div>

          <div>
            <label
              htmlFor="productmodal-field-2"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ürün Adı
            </label>
            <input
              id="productmodal-field-2"
              type="text"
              className="w-full p-3 rounded-xl border border-gray-200"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>

          {newProduct.type === "card" ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setNewProduct((p) => ({ ...p, cardType: "physical" }))
                  }
                  className={`flex-1 py-2 rounded-xl font-bold border ${
                    newProduct.cardType === "physical"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Fiziki
                </button>
                <button
                  onClick={() =>
                    setNewProduct((p) => ({ ...p, cardType: "virtual" }))
                  }
                  className={`flex-1 py-2 rounded-xl font-bold border ${
                    newProduct.cardType === "virtual"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Sanal
                </button>
              </div>

              {newProduct.type === "card" &&
                newProduct.cardType === "virtual" && (
                  <div>
                    <label
                      htmlFor="productmodal-field-3"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bağlı Olduğu Fiziki Kart
                    </label>

                    <select
                      id="productmodal-field-3"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={newProduct.parentCardId || ""}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          parentCardId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Fiziki Kart Seçiniz</option>

                      {(products || [])
                        .filter(
                          (p) =>
                            p.type === "card" &&
                            p.cardType === "physical" &&
                            String(p.bankId) === String(newProduct.bankId),
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (**** {c.last4Digits})
                          </option>
                        ))}
                    </select>

                    <p className="text-[11px] text-gray-500 mt-1">
                      Sanal kart, seçtiğiniz fiziki karta bağlı olarak sadece
                      bilgilendirme amaçlı tutulur.
                    </p>
                  </div>
                )}
              {newProduct.cardType === "physical" && <div className="statement-start-field" role="group" aria-labelledby="statement-start-title">
                <h3 id="statement-start-title">İlk ekstre ayı <span>(isteğe bağlı)</span></h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label htmlFor="statement-first-year">İlk ekstre yılı</label><select id="statement-first-year" value={statementYear} onChange={e=>setStatementPart(e.target.value,statementMonth)}><option value="">Yıl seç</option>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></div>
                  <div><label htmlFor="statement-first-month">İlk ekstre ayı</label><select id="statement-first-month" value={statementMonth} onChange={e=>setStatementPart(statementYear,e.target.value)}><option value="">Ay seç</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{new Date(2026,i,1).toLocaleDateString('tr-TR',{month:'long'})}</option>)}</select></div>
                </div>
                <p>Bu aydan önce boş ekstre satırı gösterilmez. Kayıtlı ödemeler, tutarlar ve tarihler korunur. Bilmiyorsan boş bırak.</p>
                {(statementYear || statementMonth) && <button type="button" className="statement-start-clear" onClick={()=>setStatementPart('','')}>Başlangıç ayını kaldır</button>}
              </div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="productmodal-field-4"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Son 4 Hane
                  </label>
                  <input
                    id="productmodal-field-4"
                    type="text"
                    maxLength="4"
                    className="w-full p-3 rounded-xl border border-gray-200"
                    value={newProduct.last4Digits}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        last4Digits: e.target.value,
                      }))
                    }
                  />
                </div>

                {newProduct.cardType === "physical" && (
                  <div>
                    <label
                      htmlFor="productmodal-field-5"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Limit
                    </label>
                    <input
                      id="productmodal-field-5"
                      type="number"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={newProduct.limit}
                      onChange={(e) =>
                        setNewProduct((p) => ({ ...p, limit: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              {newProduct.cardType === "physical" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="productmodal-field-6"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Kesim Günü
                    </label>
                    <input
                      id="productmodal-field-6"
                      type="number"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={newProduct.cutoffDay}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          cutoffDay: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="productmodal-field-7"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Son Ödeme Günü
                    </label>
                    <input
                      id="productmodal-field-7"
                      type="number"
                      className="w-full p-3 rounded-xl border border-gray-200"
                      value={newProduct.paymentDueDay}
                      onChange={(e) =>
                        setNewProduct((p) => ({
                          ...p,
                          paymentDueDay: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="productmodal-field-8"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Aylık Taksit (₺)
                  </label>
                  <input
                    id="productmodal-field-8"
                    disabled={!!editingItem}
                    type="number"
                    step="0.01"
                    className="w-full p-3 rounded-xl border border-gray-200"
                    value={newProduct.installmentAmount}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        installmentAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="productmodal-field-9"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kaç Taksit
                  </label>
                  <input
                    id="productmodal-field-9"
                    disabled={!!editingItem}
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200"
                    value={newProduct.totalInstallments}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        totalInstallments: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="productmodal-field-10"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  İlk Taksit Ödeme Tarihi
                </label>
                <input
                  id="productmodal-field-10"
                  disabled={!!editingItem}
                  type="date"
                  className="w-full p-3 rounded-xl border border-gray-200"
                  value={newProduct.firstPaymentDate}
                  onChange={(e) =>
                    setNewProduct((p) => ({
                      ...p,
                      firstPaymentDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl p-3">
                Toplam kredi otomatik hesaplanır:{" "}
                <b>(aylık taksit x taksit sayısı)</b>.<br></br>
                Tüm yeni taksitler ödeme bekliyor olarak oluşturulur.
              </div>
            </>
          )}
        </div>
      </div>
      {preview.length > 0 && (
        <div className="loan-plan-preview">
          <h3>Oluşturulacak ödeme planı</h3>
          <p>
            {preview.length} taksit · Toplam ₺
            {formatMoneyTR(preview.reduce((sum, row) => sum + row.amount, 0))}
          </p>
          <ol>
            {preview.slice(0, 3).map((row) => (
              <li key={row.dueDate}>
                {formatDateTR(row.dueDate)} · ₺{formatMoneyTR(row.amount)} ·
                Bekliyor
              </li>
            ))}
          </ol>
          {preview.length > 3 && (
            <p>… Son ödeme: {formatDateTR(preview.at(-1).dueDate)}</p>
          )}
        </div>
      )}
    </FormModal>
  );
};
