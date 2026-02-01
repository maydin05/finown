import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { DataProvider, useData } from './context/DataContext';

// Pages
import Login from './pages/Login';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Subscriptions from './pages/Subscriptions';
import Banks from './pages/Banks';
import Migration from './pages/Migration';

// Layout
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';

// Modals
import { SourceModal } from './modals/SourceModal';
import { BankModal } from './modals/BankModal';
import { ProductModal } from './modals/ProductModal';
import { NoteModal } from './modals/NoteModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { CardAmountModal } from './modals/CardAmountModal';
import { PaymentConfirmModal } from './modals/PaymentConfirmModal';
import { BestCardsModal } from './modals/BestCardsModal';
import { QuickMenu } from './modals/QuickMenu';

function AppContent() {
  const {
    loading, fetchData,
    banks, products,
    addBank, editBank, removeBank,
    addProduct, editProduct, removeProduct,
    addSource, updateSource, deleteSource,
    addPayment, upsertPayment, editPayment
  } = useData();

  const [session, setSession] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());

  // Navigation state
  const [paymentTab, setPaymentTab] = useState("pending");
  const [incomeTab, setIncomeTab] = useState("expected");

  // Modal State
  const [activeModal, setActiveModal] = useState("none");
  const [editingItem, setEditingItem] = useState(null);
  const [modalCallback, setModalCallback] = useState(null); // For custom modal actions

  // Forms State (Lifted up)
  const [updateScope, setUpdateScope] = useState("all");
  const [effectiveDate, setEffectiveDate] = useState("");

  // Bank Form
  const [newBankName, setNewBankName] = useState("");
  const [newBankColor, setNewBankColor] = useState("from-blue-600 to-blue-800");

  // Product Form
  const [newProduct, setNewProduct] = useState({
    bankId: "", type: "card", name: "", cardType: "physical", parentCardId: "",
    last4Digits: "", limit: "", cutoffDay: "", paymentDueDay: "",
    installmentAmount: "", totalInstallments: "", firstPaymentDate: ""
  });

  // Source Forms
  const initialSource = { title: "", amount: "", type: "recurring", date: "", endDate: "", note: "" };
  const [sourceForm, setSourceForm] = useState({ ...initialSource, category: "bills" });
  // We reuse sourceForm for Income, Expense, Subscription (mapped fields)

  // Note Modal
  const [noteText, setNoteText] = useState("");

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data on Login
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // --- Modal Handlers ---
  const closeModal = () => {
    setActiveModal("none");
    setEditingItem(null);
    setModalCallback(null);
  };

  const openModal = (type, item = null, callback = null) => {
    setEditingItem(item);
    setModalCallback(() => callback);

    // Reset forms based on type
    if (type === "bank") {
      setNewBankName(item ? item.name : "");
      setNewBankColor(item ? item.color : "from-blue-600 to-blue-800");
      setActiveModal("bankModal");
    } else if (type === "product") {
      setNewProduct(item ? { ...item } : { ...newProduct, bankId: "", name: "" }); // simplified reset
      setActiveModal("productModal");
    } else if (["income", "expense", "subscription"].includes(type)) {
      // Map item to form
      // Important: Handle date/dueDate mapping
      const d = item ? (item.date || item.dueDate) : new Date().toISOString().split('T')[0];
      const mapped = item ? { ...item, date: d.split('T')[0] } : {
        ...initialSource,
        category: type === 'income' ? 'salary' : 'bills',
        date: new Date().toISOString().split('T')[0]
      };

      // Special fields
      if (type === "subscription") {
        mapped.paymentMethodType = item?.paymentMethod?.type || "bank";
        mapped.paymentMethodValue = item?.paymentMethod?.value || "";
        mapped.relatedCardId = item?.relatedCardId || "";
      }

      setSourceForm(mapped);
      setUpdateScope("all");
      setEffectiveDate("");
      setActiveModal(type + "Modal");
    } else if (type === "note") {
      setNoteText(item ? item.note || "" : "");
      setActiveModal("noteModal");
    } else if (type === "delete_bank" || type === "delete_product" || type.startsWith("delete_")) {
      // item is the object to delete
      // augment item with type if needed
      const delType = type.replace("delete_", "");
      // But we need to pass a structured object to DeleteConfirmModal
      // Let's attach data to 'item' directly or wrapper
      // DeleteConfirmModal expects { type, data, meta }
      // Let's create a wrapper
      let wrapper = { type: delType, data: item };
      if (delType === 'bank') {
        const countP = products.filter(p => p.bankId == item.id).length;
        wrapper.meta = { productCount: countP };
      }
      setEditingItem(wrapper);
      setActiveModal("deleteConfirm");
    } else if (type === "card_amount") {
      setActiveModal("cardAmountModal");
    } else if (type === "payment_confirm") {
      // Show payment confirmation modal before marking as paid
      setActiveModal("paymentConfirmModal");
    } else if (type === "best_cards") {
      // payload passed in item
      setModalCallback(item); // hack: storing list in callback state or new state?
      // Let's use editingItem for payload
      setEditingItem(item); // this will be the list
      setActiveModal("bestCardsModal");
    }
  };

  // --- Save Handlers ---
  const handleSaveBank = async () => {
    if (!newBankName) return;
    if (editingItem) {
      await editBank(editingItem.id, { name: newBankName, color: newBankColor });
    } else {
      await addBank({ name: newBankName, color: newBankColor });
    }
    closeModal();
  };

  const handleSaveProduct = async () => {
    if (!newProduct.bankId || !newProduct.name) return;
    const payload = { ...newProduct }; // Cleanup empty fields if needed

    if (editingItem) {
      await editProduct(editingItem.id, payload);
    } else {
      await addProduct(payload);
    }
    closeModal();
  };

  const handleSaveSource = async (type) => {
    if (!sourceForm.title || !sourceForm.amount) {
      console.log('Validation failed: title or amount missing', sourceForm);
      return;
    }

    try {
      // Prepare payload - ensure amount is number
      const payload = {
        ...sourceForm,
        amount: parseFloat(String(sourceForm.amount).replace(',', '.')) || 0
      };

      console.log('Saving source:', type, editingItem?.id, payload);

      if (editingItem) {
        await updateSource(type, editingItem.id, payload);
      } else {
        await addSource(type, payload);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving source:', error);
      alert('Kaydetme hatası: ' + error.message);
    }
  };

  const handleDelete = async () => {
    const { type, data } = editingItem;
    if (type === 'bank') await removeBank(data.id);
    else if (type === 'product') await removeProduct(data.id);
    else await deleteSource(type, data.id);
    closeModal();
  };

  const handleSaveNote = async () => {
    // We act on editingItem which is the source item
    // Determine type? editingItem doesn't have type info always.
    // But we opened via onOpenModal('note', item). 
    // We lack type. 
    // Solution: pass strict item with type or determine from context.
    // Hack: check item fields? Or pass { ...item, _sourceType: 'income' }
    // For now, let's assume we iterate all types? No.
    // Let's make openModal require type or we deduce.
    // It's safer to not implement note save until we fix type passing.
    // OR: Update all tables? Expense, Income, Sub.
    // Let's quick fix: modal should know parent collection.
    // But Note is universal.
    // Let's try to update logic in pages to pass type.
    // Page calls -> onOpenModal('note', { ...item, sourceType: 'income' })
    if (!editingItem) return;
    const type = editingItem.sourceType;
    // If undefined, we fail.
    if (type && noteText !== undefined) {
      if (['income', 'expense', 'subscription'].includes(type)) {
        await updateSource(type, editingItem.id, { note: noteText });
      }
    }
    closeModal();
  };

  const handleSaveCardAmount = async (amount, dueDate) => {
    // editingItem is the payment row
    if (editingItem) {
      try {
        const parsedAmount = parseFloat(String(amount).replace(',', '.')) || 0;
        const dueDateISO = dueDate ? new Date(dueDate).toISOString() : editingItem.dueDate;

        if (editingItem.isVirtual) {
          // It's a placeholder. We need to CREATE a new payment.
          // Strip virtual fields
          // eslint-disable-next-line no-unused-vars
          const { id, isVirtual, subtitle, isManual, ...rest } = editingItem;
          const payload = {
            ...rest,
            amount: parsedAmount,
            dueDate: dueDateISO,
          };
          await upsertPayment(payload); // No ID -> Insert
        } else {
          // Existing payment -> Update
          await upsertPayment({
            ...editingItem,
            amount: parsedAmount,
            dueDate: dueDateISO
          });
        }
      } catch (error) {
        console.error('Error saving card amount:', error);
        alert('Kaydetme hatası: ' + error.message);
      }
    }
    closeModal();
  };

  // Month Navigation
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  if (!session) {
    return <Login />;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <BrowserRouter>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900 max-w-md mx-auto border-x border-gray-200 shadow-2xl overflow-hidden relative">

        {/* Header conditionally rendered */}
        <Routes>
          <Route path="/" element={null} />
          <Route path="*" element={<Header />} />
        </Routes>

        <div className="h-full overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={
              <Expenses
                viewDate={viewDate} prevMonth={prevMonth} nextMonth={nextMonth}
                onOpenModal={openModal}
                paymentTab={paymentTab} setPaymentTab={setPaymentTab}
              />
            } />
            <Route path="/incomes" element={
              <Incomes
                viewDate={viewDate} prevMonth={prevMonth} nextMonth={nextMonth}
                onOpenModal={openModal}
                incomeTab={incomeTab} setIncomeTab={setIncomeTab}
              />
            } />
            <Route path="/subscriptions" element={
              <Subscriptions
                viewDate={viewDate} prevMonth={prevMonth} nextMonth={nextMonth}
                onOpenModal={openModal}
              />
            } />
            <Route path="/banks" element={
              <Banks onOpenModal={openModal} />
            } />
            <Route path="/migration" element={<Migration />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <BottomNav
          onOpenQuickMenu={() => setActiveModal("quickMenu")}
        />

        {/* MODALS */}
        {activeModal === "quickMenu" && <QuickMenu onClose={closeModal} onAction={(t) => { closeModal(); openModal(t); }} />}
        {activeModal === "bankModal" && (
          <BankModal
            editingItem={editingItem}
            newBankName={newBankName} setNewBankName={setNewBankName}
            newBankColor={newBankColor} setNewBankColor={setNewBankColor}
            onClose={closeModal} onSave={handleSaveBank}
          />
        )}
        {activeModal === "productModal" && (
          <ProductModal
            editingItem={editingItem}
            newProduct={newProduct} setNewProduct={setNewProduct}
            banks={banks} products={products}
            onClose={closeModal} onSave={handleSaveProduct}
          />
        )}
        {activeModal === "incomeModal" && (
          <SourceModal
            type="income" editingItem={editingItem}
            form={sourceForm} setForm={setSourceForm}
            banks={banks} products={products}
            updateScope={updateScope} setUpdateScope={setUpdateScope}
            effectiveDate={effectiveDate} setEffectiveDate={setEffectiveDate}
            onClose={closeModal} onSave={() => handleSaveSource('income')}
          />
        )}
        {activeModal === "expenseModal" && (
          <SourceModal
            type="expense" editingItem={editingItem}
            form={sourceForm} setForm={setSourceForm}
            banks={banks} products={products}
            updateScope={updateScope} setUpdateScope={setUpdateScope}
            effectiveDate={effectiveDate} setEffectiveDate={setEffectiveDate}
            onClose={closeModal} onSave={() => handleSaveSource('expense')}
          />
        )}
        {activeModal === "subscriptionModal" && (
          <SourceModal
            type="subscription" editingItem={editingItem}
            form={sourceForm} setForm={setSourceForm}
            banks={banks} products={products}
            updateScope={updateScope} setUpdateScope={setUpdateScope}
            effectiveDate={effectiveDate} setEffectiveDate={setEffectiveDate}
            onClose={closeModal} onSave={() => handleSaveSource('subscription')}
          />
        )}
        {activeModal === "deleteConfirm" && <DeleteConfirmModal deletingItem={editingItem} onClose={closeModal} onConfirm={handleDelete} />}
        {activeModal === "noteModal" && <NoteModal item={editingItem} noteText={noteText} setNoteText={setNoteText} onClose={closeModal} onSave={handleSaveNote} />}
        {activeModal === "cardAmountModal" && <CardAmountModal target={editingItem} onClose={closeModal} onSave={handleSaveCardAmount} />}
        {activeModal === "paymentConfirmModal" && (
          <PaymentConfirmModal
            payment={editingItem}
            banks={banks}
            products={products}
            onClose={closeModal}
            onConfirm={async (payment) => {
              try {
                await editPayment(payment.id, { isPaid: true });
                closeModal();
              } catch (error) {
                console.error('Error confirming payment:', error);
                alert('Ödeme onaylanırken hata oluştu: ' + error.message);
              }
            }}
          />
        )}
        {activeModal === "bestCardsModal" && <BestCardsModal bestCards={editingItem} banks={banks} onClose={closeModal} />}
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
