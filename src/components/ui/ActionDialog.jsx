import React, { useState } from "react";
import { ModalShell } from "./Modal";
import { Icon } from "./Icon";

export function ActionDialog({
  title,
  subtitle,
  tone = "confirm",
  icon = "check-circle",
  actions = [],
  children,
}) {
  const [pending, setPending] = useState(null);
  const busy = pending !== null;
  const [error, setError] = useState("");
  const dismiss = actions.find((action) => action.cancel)?.onClick;
  const run = async (action) => {
    if (busy) return;
    setPending(action.label);
    setError("");
    try {
      await action.onClick?.();
    } catch {
      setError("İşlem tamamlanamadı. Tekrar deneyebilirsin.");
    } finally {
      setPending(null);
    }
  };
  return (
    <ModalShell
      label={title}
      onClose={() => {
        if (!busy) dismiss?.();
      }}
      className={`form-dialog action-dialog tone-${tone}`}
    >
      <header className="form-header">
        <span className="form-emblem">
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Kapat"
          disabled={busy}
          onClick={dismiss}
        >
          <Icon name="x" size={20} />
        </button>
      </header>
      <div className="form-body" aria-busy={busy}>
        <fieldset className="form-fieldset" disabled={busy}>
          {children}
        </fieldset>
      </div>
      <footer className="form-footer">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={() => run(action)}
              className={`${action.primary ? "primary-button" : "secondary-button"} ${action.danger ? "destructive-action" : ""} ${action.fullWidth ? "full-width-action" : ""}`}
            >
              {pending === action.label && !action.cancel
                ? "İşleniyor…"
                : action.label}
            </button>
          ))}
        </div>
      </footer>
    </ModalShell>
  );
}
