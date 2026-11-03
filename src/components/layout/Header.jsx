import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Icon } from "../ui/Icon";
import { ModalShell } from "../ui/Modal";

export const Header = ({ onOpenQuickMenu, onSignOut, readOnly }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <>
      <header className="app-header app-header-compact">
        <Link to="/" className="wordmark" aria-label="Finown ana ekran">
          <span className="brand-symbol">f</span>finown
        </Link>
        <div className="header-actions">
          {!readOnly && <button
            className="icon-button add-action"
            aria-label="Yeni kayıt ekle"
            onClick={onOpenQuickMenu}
          >
            <Icon name="plus" />
          </button>}
          <button
            className="account-button"
            onClick={() => setAccountOpen(true)}
            aria-label="Hesap menüsü"
          >
            <Icon name="user-round" size={18} />
          </button>
        </div>
      </header>
      {accountOpen && (
        <ModalShell onClose={() => setAccountOpen(false)} label="Hesap menüsü">
          <div className="sheet-content">
            <div className="sheet-heading">
              <h2>Hesabım</h2>
              <button
                className="icon-button"
                aria-label="Kapat"
                onClick={() => setAccountOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <Link className="secondary-button" to="/family" onClick={() => setAccountOpen(false)}>Aile bütçesi</Link>
            <button
              className="secondary-button"
              onClick={() =>
                onSignOut ? onSignOut() : supabase.auth.signOut()
              }
            >
              Çıkış yap
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
};
