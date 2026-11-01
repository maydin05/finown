import React, { useState } from "react";
import { useData } from "../context/store";
import CashFlowSummary from "../components/CashFlowSummary";
import { ModalShell } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { formatDateTR, formatMoneyTR } from "../utils";

import IncomeReceiptModal from "../modals/IncomeReceiptModal";

export default function Overview({ onOpenModal, ownerId }) {
  const { toggleTracker } = useData();
  const [receiptItem, setReceiptItem] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const openItem = (item) => {
    setError("");
    setSelected(item);
  };
  const complete = async () => {
    if (saving || !selected) return;
    if (selected.direction === "in") {
      setReceiptItem(selected);
      setSelected(null);
      return;
    }
    if (selected.recordType === "payment") {
      onOpenModal("payment_confirm", selected);
      setSelected(null);
      return;
    }
    setSaving(true);
    try {
      await toggleTracker(selected.trackerKey, false);
      setSelected(null);
    } catch {
      setError("Durum kaydedilemedi. Tekrar deneyebilirsin.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="calm-page overview-page">
      <CashFlowSummary ownerId={ownerId} onOpenModal={onOpenModal} onOpenItem={openItem} />
      {receiptItem && <IncomeReceiptModal item={receiptItem} onClose={() => setReceiptItem(null)} />}
      {selected && (
        <ModalShell
          onClose={() => {
            if (!saving) setSelected(null);
          }}
          label="Hareket ayrıntısı"
        >
          <div className="sheet-content">
            <div className="sheet-heading">
              <h2>{selected.title}</h2>
              <button
                disabled={saving}
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Kapat"
              >
                <Icon name="x" />
              </button>
            </div>
            <p className="detail-figure">₺{formatMoneyTR(selected.amount)}</p>
            <dl className="detail-list">
              <div>
                <dt>Tarih</dt>
                <dd>{formatDateTR(selected.dueDate)}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>
                  {selected.direction === "in"
                    ? "Beklenen gelir"
                    : "Ödeme bekleniyor"}
                </dd>
              </div>
            </dl>
            {selected.note && <p>{selected.note}</p>}
            {error && <p role="alert">{error}</p>}
            <button
              className="primary-button"
              disabled={saving}
              onClick={complete}
            >
              {saving
                ? "Kaydediliyor…"
                : selected.direction === "in"
                  ? "Alındı olarak işaretle"
                  : "Ödendi olarak işaretle"}
            </button>
            <p className="footnote">
              Bu işlem bankadan ödeme yapmaz; yalnızca ödeme durumunu kaydeder.
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
