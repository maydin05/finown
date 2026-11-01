import React, { useState, useCallback, useRef, useMemo } from "react";
import * as api from "../api/finown";
import { legacyOwners, monthDate, dateKey } from "../domain/finance";

import { DataContext } from "./store";

export const DataProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [incomeReceipts, setIncomeReceipts] = useState([]);
  const [incomeSources, setIncomeSources] = useState([]);
  const [expenseSources, setExpenseSources] = useState([]);
  const [subscriptionSources, setSubscriptionSources] = useState([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [statusTracker, setStatusTracker] = useState({});

  // Veri yüklendi mi?
  const loadedRef = useRef(false);

  const [loadError, setLoadError] = useState(null);
  const trackerOwners = useMemo(
    () => legacyOwners({ incomeSources, expenseSources, subscriptionSources }),
    [incomeSources, expenseSources, subscriptionSources],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api.getAllData();
      setUserId(data.userId);
      setAvailableBalance(data.availableBalance);
      setBanks(data.banks);
      setProducts(data.products);
      setPayments(data.payments);
      setIncomeSources(data.incomeSources);
      setIncomeReceipts(data.incomeReceipts || []);
      setExpenseSources(data.expenseSources);
      setSubscriptionSources(data.subscriptionSources);
      setSubscriptionPayments(data.subscriptionPayments || []);
      setStatusTracker(data.statusTracker); // merging status & sub trackers
      loadedRef.current = true;

      // Reading data never creates or migrates payment records.
    } catch (error) {
      console.error("Data fetch failed:", error);
      setLoadError(
        "Veriler alınamadı. Toplamlar doğrulanamadı; lütfen tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAvailableBalance = async (snapshot) => {
    const saved = await api.saveAvailableBalance(snapshot, userId);
    setAvailableBalance(saved);
    return saved;
  };

  const saveIncomeReceipt = async (receipt) => {
    const saved = await api.saveIncomeReceipt(receipt, userId);
    setIncomeReceipts(prev => [...prev.filter(r => !(String(r.incomeId) === String(saved.incomeId) && r.periodYear === saved.periodYear && r.periodMonth === saved.periodMonth)), saved]);
    return saved;
  };

  // --- BANKS ---
  const addBank = async (bank) => {
    const newItem = await api.createBank(bank);
    setBanks((prev) => [...prev, newItem]);
    return newItem;
  };
  const editBank = async (id, updates) => {
    const updated = await api.updateBank(id, updates);
    setBanks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };
  const removeBank = async (id) => {
    await api.deleteBank(id);
    setBanks((prev) => prev.filter((b) => b.id !== id));
  };

  // --- PRODUCTS ---
  const addProduct = async (product) => {
    if (product.type === "loan") {
      const result = await api.createLoanWithPayments(product);
      setProducts((prev) => [
        ...prev.filter((p) => p.id !== result.product.id),
        result.product,
      ]);
      setPayments((prev) => [
        ...prev.filter((p) => !result.payments.some((row) => row.id === p.id)),
        ...result.payments,
      ]);
      return result.product;
    }
    const newItem = await api.createProduct(product);
    setProducts((prev) => [...prev, newItem]);
    return newItem;
  };
  const editProduct = async (id, updates) => {
    const updated = await api.updateProduct(id, updates);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };
  const removeProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    // Cleanup payments related to this product (loans)
    await cleanPaymentsForProduct(id);
  };

  // --- PAYMENTS ---
  // Single payment upsert (e.g. tracking paid status manually or card amounts)
  const upsertPayment = async (payment) => {
    // Check if it's an existing payment (has a valid numeric id, not a virtual id like "virtual_9")
    const hasValidId =
      (payment.id && typeof payment.id === "number") ||
      (typeof payment.id === "string" &&
        !payment.id.startsWith("virtual") &&
        !isNaN(Number(payment.id)));

    if (hasValidId) {
      // Existing payment -> Update
      return editPayment(payment.id, payment);
    } else {
      // New payment -> Insert
      return addPayment(payment);
    }
  };
  const addPayment = async (item) => {
    const newItem = await api.createPayment(item);
    setPayments((prev) => [...prev, newItem]);
    return newItem;
  };
  const editPayment = async (id, updates) => {
    const updated = await api.updatePayment(id, updates);
    setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };
  const removePayment = async (id) => {
    await api.deletePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };
  const addPaymentsBulk = async (items) => {
    if (!items.length) return;
    const newItems = await api.createPaymentsBulk(items);
    setPayments((prev) => [...prev, ...newItems]);
  };
  const cleanPaymentsForProduct = async (productId) => {
    await api.deletePaymentsByProductId(productId);
    setPayments((prev) => prev.filter((p) => p.productId !== productId));
  };

  // --- SOURCES (Income, Expense, Sub) ---
  const addSource = async (type, item) => {
    let newItem;
    if (type === "income") {
      newItem = await api.createIncome(item);
      setIncomeSources((prev) => [...prev, newItem]);
    } else if (type === "expense") {
      newItem = await api.createExpense(item);
      setExpenseSources((prev) => [...prev, newItem]);
    } else if (type === "subscription") {
      newItem = await api.createSubscription(item);
      setSubscriptionSources((prev) => [...prev, newItem]);
    }
    return newItem;
  };

  const updateSource = async (type, id, updates) => {
    let updated;
    if (type === "income") {
      updated = await api.updateIncome(id, updates);
      setIncomeSources((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } else if (type === "expense") {
      updated = await api.updateExpense(id, updates);
      setExpenseSources((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } else if (type === "subscription") {
      updated = await api.updateSubscription(id, updates);
      setSubscriptionSources((prev) =>
        prev.map((i) => (i.id === id ? updated : i)),
      );
    }
    return updated;
  };

  const deleteSource = async (type, id) => {
    if (type === "income") {
      await api.deleteIncome(id);
      setIncomeSources((prev) => prev.filter((i) => i.id !== id));
    } else if (type === "expense") {
      await api.deleteExpense(id);
      setExpenseSources((prev) => prev.filter((i) => i.id !== id));
    } else if (type === "subscription") {
      await api.deleteSubscription(id);
      setSubscriptionSources((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // --- TRACKERS ---
  const toggleTracker = async (key, currentValue) => {
    // Optimistic update
    const newValue = !currentValue;
    setStatusTracker((prev) => ({ ...prev, [key]: newValue }));

    try {
      await api.upsertTracker(key, newValue);
    } catch (err) {
      // Rollback
      setStatusTracker((prev) => ({ ...prev, [key]: currentValue }));
      console.error("Tracker update failed", err);
      alert(
        "Durum kaydedilemedi. Önceki durum korundu; lütfen tekrar deneyin.",
      );
      throw err;
    }
  };

  // --- SUBSCRIPTION PAYMENTS ---
  const saveSubscriptionPayment = async (payment) => {
    const saved = await api.upsertSubscriptionPayment(payment);
    setSubscriptionPayments((prev) => {
      const exists = prev.some(
        (p) =>
          p.id === saved.id ||
          (p.subscriptionId === saved.subscriptionId &&
            p.periodYear === saved.periodYear &&
            p.periodMonth === saved.periodMonth),
      );
      if (exists) {
        return prev.map((p) =>
          p.id === saved.id ||
          (p.subscriptionId === saved.subscriptionId &&
            p.periodYear === saved.periodYear &&
            p.periodMonth === saved.periodMonth)
            ? saved
            : p,
        );
      }
      return [...prev, saved];
    });
    return saved;
  };

  const markSubscriptionPaid = async (
    subscriptionId,
    year,
    month,
    actualAmount,
    paidDate,
    note,
    isPaid = true,
  ) => {
    const sub = subscriptionSources.find((s) => s.id === subscriptionId);
    if (!sub) return;

    const existing = subscriptionPayments.find(
      (p) =>
        p.subscriptionId === subscriptionId &&
        p.periodYear === year &&
        p.periodMonth === month,
    );

    const payment = {
      ...(existing || {}),
      subscriptionId,
      periodYear: year,
      periodMonth: month,
      expectedAmount: sub.amount,
      actualAmount:
        actualAmount !== undefined && actualAmount !== null
          ? Number(actualAmount)
          : sub.amount,
      dueDate:
        existing?.dueDate ||
        dateKey(
          monthDate(
            year,
            month - 1,
            sub.dayOfMonth ||
              Number((sub.startDate || sub.date || "").slice(8, 10)) ||
              1,
          ),
        ),
      paidDate: paidDate || dateKey(),
      isPaid,
      note: note !== undefined ? note : existing?.note || "",
    };

    return saveSubscriptionPayment(payment);
  };

  const toggleSubscriptionPaid = async (
    subscriptionId,
    year,
    month,
    currentIsPaid,
  ) => {
    const sub = subscriptionSources.find((s) => s.id === subscriptionId);
    if (!sub) return;

    const existing = subscriptionPayments.find(
      (p) =>
        p.subscriptionId === subscriptionId &&
        p.periodYear === year &&
        p.periodMonth === month,
    );
    const nextIsPaid = !currentIsPaid;

    const payment = {
      ...(existing || {}),
      subscriptionId,
      periodYear: year,
      periodMonth: month,
      expectedAmount: sub.amount,
      actualAmount: nextIsPaid ? sub.amount : null,
      dueDate:
        existing?.dueDate ||
        dateKey(
          monthDate(
            year,
            month - 1,
            sub.dayOfMonth ||
              Number((sub.startDate || sub.date || "").slice(8, 10)) ||
              1,
          ),
        ),
      paidDate: nextIsPaid ? dateKey() : null,
      isPaid: nextIsPaid,
    };

    return saveSubscriptionPayment(payment);
  };

  // --- RESET ---
  const resetData = () => {
    setUserId(null);
    setAvailableBalance(null);
    setBanks([]);
    setProducts([]);
    setPayments([]);
    setIncomeSources([]);
    setIncomeReceipts([]);
    setExpenseSources([]);
    setSubscriptionSources([]);
    setSubscriptionPayments([]);
    setStatusTracker({});
    loadedRef.current = false;
    setLoadError(null);
  };

  const value = {
    userId, availableBalance, saveAvailableBalance,
    loading,
    loadError,
    trackerOwners,
    fetchData,
    resetData,

    banks,
    products,
    payments,
    incomeSources,
    incomeReceipts, saveIncomeReceipt,
    expenseSources,
    subscriptionSources,
    subscriptionPayments,
    statusTracker,

    addBank,
    editBank,
    removeBank,
    addProduct,
    editProduct,
    removeProduct,
    addPayment,
    editPayment,
    removePayment,
    upsertPayment,
    addPaymentsBulk,
    cleanPaymentsForProduct,

    addSource,
    updateSource,
    deleteSource,

    toggleTracker,
    saveSubscriptionPayment,
    markSubscriptionPaid,
    toggleSubscriptionPaid,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
