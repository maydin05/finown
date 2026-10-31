import React from "react";
import { FormModal } from "../components/ui/FormModal";
import { Icon } from "../components/ui/Icon";

const colors = [
  ["Mavi", "from-blue-600 to-blue-800"],
  ["Yeşil", "from-green-600 to-green-800"],
  ["Kırmızı", "from-red-600 to-red-800"],
  ["Mor", "from-purple-600 to-purple-800"],
  ["Turuncu", "from-orange-500 to-orange-700"],
  ["Gri", "from-gray-700 to-gray-900"],
  ["Zümrüt", "from-emerald-500 to-teal-700"],
  ["Pembe", "from-rose-500 to-pink-700"],
];
export const BankModal = ({
  editingItem,
  newBankName,
  setNewBankName,
  newBankColor,
  setNewBankColor,
  onClose,
  onSave,
}) => (
  <FormModal
    title={editingItem ? "Banka Düzenle" : "Yeni Banka Ekle"}
    subtitle="Bankanı adı ve rengiyle kolayca ayırt et"
    tone="banks"
    icon="landmark"
    onClose={onClose}
    onSave={onSave}
  >
    <div className="form-fields">
      <div>
        <label htmlFor="bank-name">Banka Adı</label>
        <input
          id="bank-name"
          type="text"
          value={newBankName}
          onChange={(e) => setNewBankName(e.target.value)}
          placeholder="Örn: Ziraat Bankası"
        />
      </div>
      <fieldset className="bank-colors">
        <legend>Tema Rengi</legend>
        <div>
          {colors.map(([name, color]) => (
            <button
              key={color}
              type="button"
              aria-label={name}
              aria-pressed={newBankColor === color}
              onClick={() => setNewBankColor(color)}
              className={`bank-color-swatch bg-gradient-to-br ${color}`}
            >
              {newBankColor === color && <Icon name="check" size={19} />}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  </FormModal>
);
