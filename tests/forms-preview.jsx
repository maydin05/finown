// Local UI fixtures: no database writes; auth requests must not be submitted here.
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { PaymentConfirmModal } from "../src/modals/PaymentConfirmModal";
import { DeleteConfirmModal } from "../src/modals/DeleteConfirmModal";
import Login from "../src/pages/Login";
import { SourceModal } from "../src/modals/SourceModal";
import { BankModal } from "../src/modals/BankModal";
import { ProductModal } from "../src/modals/ProductModal";
import { NoteModal } from "../src/modals/NoteModal";
import { CardAmountModal } from "../src/modals/CardAmountModal";
import { PaymentEntryModal } from "../src/modals/PaymentEntryModal";
import "../src/index.css";
const previewAuth = {
  signInWithPassword: async () => ({
    error: new Error("Bu bir önizleme; gerçek hesaba giriş yapılmaz."),
  }),
  signUp: async () => ({
    error: new Error("Bu bir önizleme; gerçek hesap oluşturulmaz."),
  }),
};
const banks = [
  { id: 1, name: "Örnek Banka" },
  { id: 2, name: "İkinci Örnek Banka" },
];
const products = [
  {
    id: 1,
    bankId: 1,
    type: "card",
    cardType: "physical",
    name: "Örnek fiziksel kart",
    last4Digits: "1042",
  },
];
const initialSource = {
  title: "",
  amount: "",
  category: "bills",
  type: "recurring",
  date: "2026-11-06",
  endDate: "",
  note: "",
  isVariable: false,
  billingCycle: "monthly",
  paymentMethodType: "bank",
  paymentMethodValue: "1",
  relatedCardId: "",
};
const initialProduct = {
  bankId: "1",
  type: "card",
  name: "",
  cardType: "physical",
  parentCardId: "",
  last4Digits: "",
  limit: "",
  cutoffDay: "",
  paymentDueDay: "",
  installmentAmount: "",
  totalInstallments: "",
  firstPaymentDate: "",
};
export function FormsPreview() {
  const [active, setActive] = useState("");
  const [form, setForm] = useState(initialSource);
  const [product, setProduct] = useState(initialProduct);
  const [bankName, setBankName] = useState("");
  const [bankColor, setBankColor] = useState("from-blue-600 to-blue-800");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState("all");
  const [effective, setEffective] = useState("");
  const [saved, setSaved] = useState(null);
  const [fail, setFail] = useState(false);
  const close = () => setActive("");
  const save = async (payload) => {
    await new Promise((r) => setTimeout(r, 100));
    if (fail) throw new Error("Synthetic failure");
    setSaved(payload);
    close();
  };
  const open = (key) => {
    setForm({
      ...initialSource,
      ...(key === "expense-edit"
        ? { title: "Örnek gider", amount: "2500" }
        : {}),
    });
    setProduct(initialProduct);
    setSaved(null);
    setActive(key);
  };
  if (new URLSearchParams(location.search).get("screen") === "login")
    return <Login auth={previewAuth} />;
  return (
    <div className="app-shell">
      <main className="calm-page">
        <h1 className="text-2xl font-bold mt-6">Form önizlemesi</h1>
        <p className="muted text-sm mt-3">
          Yalnız örnek veriler · kaydetme işlemleri bu sayfada kalır.
        </p>
        <a className="secondary-button block text-center" href="?screen=login">
          Giriş ekranını gör
        </a>
        {Object.entries({
          income: "Gelir ekle",
          "expense-edit": "Gider düzenle",
          subscription: "Abonelik ekle",
          bank: "Banka ekle",
          product: "Kart/Kredi ekle",
          card: "Ekstre düzenle",
          paid: "Abonelik ödemesi",
          note: "Not düzenle",
          confirm: "Ödeme onayını gör",
          delete: "Silme onayını gör",
          "delete-bank": "Banka silmeyi gör",
          "delete-subscription": "Abonelik silmeyi gör",
          "archived-subscription": "Arşivlenmiş aboneliği gör",
        }).map(([key, label]) => (
          <button
            className="secondary-button"
            key={key}
            onClick={() => open(key)}
          >
            {label}
          </button>
        ))}
        <label className="block mt-6 text-sm">
          <input
            type="checkbox"
            checked={fail}
            onChange={(e) => setFail(e.target.checked)}
          />{" "}
          Kaydetme hatası göster (örnek)
        </label>
        <output data-testid="saved-data" className="sr-only">
          {JSON.stringify(saved)}
        </output>
      </main>
      {["income", "expense-edit", "subscription"].includes(active) && (
        <SourceModal
          type={active === "expense-edit" ? "expense" : active}
          editingItem={active === "expense-edit" ? { id: 1 } : null}
          form={form}
          setForm={setForm}
          banks={banks}
          products={products}
          updateScope={scope}
          setUpdateScope={setScope}
          effectiveDate={effective}
          setEffectiveDate={setEffective}
          onClose={close}
          onSave={() => save({ form, scope, effective })}
        />
      )}
      {active === "bank" && (
        <BankModal
          newBankName={bankName}
          setNewBankName={setBankName}
          newBankColor={bankColor}
          setNewBankColor={setBankColor}
          onClose={close}
          onSave={() => save({ bankName, bankColor })}
        />
      )}
      {active === "product" && (
        <ProductModal
          newProduct={product}
          setNewProduct={setProduct}
          banks={banks}
          products={products}
          onClose={close}
          onSave={() => save(product)}
        />
      )}
      {active === "card" && (
        <CardAmountModal
          target={{ title: "Örnek kart", amount: 0, dueDate: "2026-11-06" }}
          onClose={close}
          onSave={(amount, dueDate) => save({ amount, dueDate })}
        />
      )}
      {active === "paid" && (
        <PaymentEntryModal
          item={{ title: "Örnek abonelik", expectedAmount: 500 }}
          onClose={close}
          onSave={(amount, paidDate, note) => save({ amount, paidDate, note })}
        />
      )}
      {active === "confirm" && (
        <PaymentConfirmModal
          payment={{
            id: 42,
            productId: 1,
            type: "card",
            title: "Örnek kart ödemesi",
            amount: 3250,
            dueDate: "2026-11-06",
            subtitle: "Kasım dönemi",
          }}
          banks={banks}
          products={[{ ...products[0], limit: 20000 }]}
          onClose={close}
          onConfirm={(payment) => save({ action: "paid", id: payment.id })}
        />
      )}
      {[
        "delete",
        "delete-bank",
        "delete-subscription",
        "archived-subscription",
      ].includes(active) && (
        <DeleteConfirmModal
          deletingItem={{
            type:
              active === "delete-bank"
                ? "bank"
                : active === "delete"
                  ? "expense"
                  : "subscription",
            data: {
              id: 42,
              title: "Örnek kayıt",
              name: "Örnek banka",
              amount: 500,
              isArchived: active === "archived-subscription",
            },
            meta: { productCount: 2, paymentsCount: 4, subscriptionsCount: 3 },
          }}
          onClose={close}
          onConfirm={() => save({ action: "delete" })}
          onSoftDelete={() => save({ action: "archive" })}
          onReactivate={() => save({ action: "reactivate" })}
        />
      )}
      {active === "note" && (
        <NoteModal
          item={{ title: "Örnek kayıt" }}
          noteText={note}
          setNoteText={setNote}
          onClose={close}
          onSave={() => save({ note })}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<FormsPreview />);
