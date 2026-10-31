import { dateKey } from "../domain/finance";
import React, { useState } from "react";
import { FormModal } from "../components/ui/FormModal";
import { formatMoneyTR } from "../utils";

export const PaymentEntryModal = ({ item, onClose, onSave }) => {
  const expected = Number(item.expectedAmount || item.amount || 0);
  const [amount, setAmount] = useState(
    item.actualAmount != null ? String(item.actualAmount) : String(expected),
  );
  const [paidDate, setPaidDate] = useState(item.paidDate || dateKey());
  const [note, setNote] = useState(item.note || "");
  const diff = (parseFloat(amount.replace(",", ".")) || 0) - expected;
  return (
    <FormModal
      title="Ödeme Tutarı Gir"
      subtitle={item.title}
      tone="subscriptions"
      icon="repeat"
      onClose={onClose}
      onSave={() =>
        onSave(parseFloat(amount.replace(",", ".")) || 0, paidDate, note)
      }
      saveLabel="Ödendi Olarak Kaydet"
      disabled={!amount}
    >
      <div className="form-fields">
        <div className="form-context">
          <p>Beklenen Aylık Tutar</p>
          <strong>₺{formatMoneyTR(expected)}</strong>
        </div>
        <div>
          <label htmlFor="subscription-paid-amount">
            Ödenen Gerçek Tutar (₺)
          </label>
          <input
            id="subscription-paid-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
          {amount !== "" && (
            <p className={`form-hint ${diff > 0 ? "form-increase" : ""}`}>
              {diff === 0
                ? "Beklenen tutar ile aynı"
                : `Beklenenden ₺${formatMoneyTR(Math.abs(diff))} ${diff > 0 ? "daha fazla" : "daha az"}`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="subscription-paid-date">Ödeme Tarihi</label>
          <input
            id="subscription-paid-date"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="subscription-period-note">
            Dönem Notu (Opsiyonel)
          </label>
          <textarea
            id="subscription-period-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bu aya özel bir açıklama ekleyebilirsin"
          />
        </div>
      </div>
    </FormModal>
  );
};
