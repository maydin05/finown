import {useData} from '../../context/store';
import React, { useState } from "react";
import { Icon } from "../ui/Icon";
import { ModalShell } from "../ui/Modal";
import { formatMoneyTR } from "../../utils";

export function RecordRow({
  title,
  amount,
  meta,
  icon = "receipt",
  income = false,
  status,
  unknown = false,
  detail,
  actions = [],
  onEnterAmount,
  visual,
  bankName,
}) {
  const readOnly=useData()?.readOnly;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const perform = async (action) => {
    if (busy) return;
    if (action.opensModal) {
      setOpen(false);
      action.onClick();
      return;
    }
    setBusy(true);
    setError("");
    try {
      await action.onClick();
      setOpen(false);
    } catch {
      setError("İşlem kaydedilemedi. Tekrar deneyebilirsin.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="movement-row record-row">
      <button
        className="movement-main"
        aria-label={`${title} ayrıntısı`}
        aria-description={bankName}
        onClick={() => setOpen(true)}
      >
        {visual || <span className={`movement-icon ${income ? "income" : ""}`}>
          <Icon name={icon} size={19} />
        </span>}
        <span className="movement-copy">
          <h3>{title}</h3>
          <span>{bankName && <b className="payment-bank-name">{bankName} · </b>}{meta}</span>
          {status && <span className="record-status">{status}</span>}
        </span>
        <span className={`movement-amount ${income ? "income" : ""}`}>
          {unknown ? (
            <span className="unknown-amount">Ekstre tutarı girilmedi</span>
          ) : (
            `${income ? "+" : ""}₺${formatMoneyTR(amount)}`
          )}
        </span>
      </button>
      {!readOnly && unknown && onEnterAmount && (
        <button className="inline-action" onClick={onEnterAmount}>
          Ekstre tutarı gir <Icon name="arrow-right" size={13} />
        </button>
      )}
      {open && (
        <ModalShell
          onClose={() => {
            if (!busy) setOpen(false);
          }}
          label={`${title} ayrıntısı`}
        >
          <div className="sheet-content">
            <div className="sheet-heading">
              <h2>{title}</h2>
              <button
                className="icon-button"
                aria-label="Kapat"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <p className="detail-figure">
              {unknown ? "Tutar girilmedi" : `₺${formatMoneyTR(amount)}`}
            </p>
            <p>
              {meta}
              {status ? ` · ${status}` : ""}
            </p>
            {bankName && <p className="record-detail-bank">{bankName}</p>}
            {detail}
            {error && <p role="alert">{error}</p>}
            {(readOnly ? [] : actions)
              .filter((action) => action.onClick)
              .map((action, index) => (
                <button
                  key={action.label}
                  disabled={busy}
                  className={`${index === 0 && !action.danger ? "primary-button" : "secondary-button"} ${action.danger ? "danger-button" : ""}`}
                  onClick={() => perform(action)}
                >
                  {busy ? "Kaydediliyor…" : action.label}
                </button>
              ))}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
