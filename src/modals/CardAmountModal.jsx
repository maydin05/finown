import React, { useState } from "react";
import { FormModal } from "../components/ui/FormModal";

export const CardAmountModal = ({ target, onClose, onSave }) => {
  const [amount, setAmount] = useState(
    target?.amount != null ? String(target.amount) : "",
  );
  const [dueDate, setDueDate] = useState(() =>
    target?.dueDate ? new Date(target.dueDate).toISOString().split("T")[0] : "",
  );
  return (
    <FormModal
      title={target?.type === "loan" ? "Taksit Ödemesi" : "Kredi Kartı Ödemesi"}
      subtitle={target?.title}
      tone="payments"
      icon="credit-card"
      onClose={onClose}
      onSave={() => onSave(amount, dueDate)}
      saveLabel="Bilgileri Kaydet"
    >
      <div className="form-fields">
        <div>
          <label htmlFor="statement-amount">Tutar (₺)</label>
          <input
            id="statement-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div>
          <label htmlFor="statement-date">Son Ödeme Tarihi</label>
          <input
            id="statement-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
    </FormModal>
  );
};
