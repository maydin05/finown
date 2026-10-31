import React, { useState } from "react";
import { useData } from "../context/store";
import CashFlowSummary from "../components/CashFlowSummary";
import { ModalShell } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { formatDateTR, formatMoneyTR } from "../utils";

export default function Overview({ onOpenModal }) {
  const { toggleTracker } = useData();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const openItem = (item) => {
    setError("");
    setSelected(item);
  };
  const complete = async () => {
    if (saving || !selected) return;
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
      <p className="greeting">Merhaba</p>
      <div className="page-title">
        <h1>Finansal özetin</h1>
        <span>
          {new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
      <CashFlowSummary onOpenModal={onOpenModal} onOpenItem={openItem} />
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
