import React, { useState } from "react";
import { ModalShell } from "./Modal";
import { Icon } from "./Icon";

export function FormModal({
  title,
  subtitle,
  tone = "banks",
  icon = "plus",
  onClose,
  onSave,
  saveLabel = "Kaydet",
  disabled = false,
  children,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const close = () => {
    if (!saving) onClose();
  };
  const save = async () => {
    if (saving || disabled) return;
    setSaving(true);
    setError("");
    try {
      await onSave();
    } catch {
      setError(
        "Kaydedilemedi. Bilgilerini kontrol edip tekrar deneyebilirsin.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <ModalShell
      onClose={close}
      label={title}
      className={`form-dialog tone-${tone}`}
    >
      <header className="form-header">
        <span className="form-emblem">
          <Icon name={icon} size={21} />
        </span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={close}
          disabled={saving}
          aria-label="Kapat"
        >
          <Icon name="x" size={20} />
        </button>
      </header>
      <div className="form-body" aria-busy={saving}>
        <fieldset disabled={saving} className="form-fieldset">
          {children}
        </fieldset>
      </div>
      <footer className="form-footer">
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={close}
            disabled={saving}
          >
            Vazgeç
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={save}
            disabled={saving || disabled}
          >
            {saving ? "Kaydediliyor…" : saveLabel}
          </button>
        </div>
      </footer>
    </ModalShell>
  );
}
