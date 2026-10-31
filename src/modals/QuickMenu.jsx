import React from "react";
import { ModalShell } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";

export const QuickMenu = ({ onClose, onAction }) => (
  <ModalShell onClose={onClose} label="Yeni kayıt ekle">
    <div className="sheet-content">
      <div className="sheet-heading">
        <h2>Yeni kayıt</h2>
        <button className="icon-button" aria-label="Kapat" onClick={onClose}>
          <Icon name="x" />
        </button>
      </div>
      <div className="quick-actions">
        {[
          ["income", "arrow-up-right", "Gelir ekle"],
          ["expense", "receipt", "Gider ekle"],
          ["subscription", "repeat", "Abonelik ekle"],
          ["bank", "landmark", "Banka ekle"],
          ["product", "credit-card", "Kart / kredi ekle"],
        ].map(([type, icon, label]) => (
          <button key={type} onClick={() => onAction(type)}>
            <span className="movement-icon">
              <Icon name={icon} />
            </span>
            <span>{label}</span>
            <Icon name="chevron-right" size={17} />
          </button>
        ))}
      </div>
    </div>
  </ModalShell>
);
