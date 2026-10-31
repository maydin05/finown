import React from "react";
import { FormModal } from "../components/ui/FormModal";

export const NoteModal = ({ item, noteText, setNoteText, onClose, onSave }) => (
  <FormModal
    title="Notlarım"
    subtitle={item?.title}
    tone="subscriptions"
    icon="sticky-note"
    onClose={onClose}
    onSave={onSave}
  >
    <div className="form-fields">
      <div>
        <label htmlFor="record-note">Kayıt Notu</label>
        <textarea
          id="record-note"
          rows={6}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Bu kayıtla ilgili hatırlamak istediklerin…"
        />
      </div>
    </div>
  </FormModal>
);
