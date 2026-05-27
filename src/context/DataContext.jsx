import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import * as api from '../api/finown';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState([]);
    const [products, setProducts] = useState([]);
    const [payments, setPayments] = useState([]);
    const [incomeSources, setIncomeSources] = useState([]);
    const [expenseSources, setExpenseSources] = useState([]);
    const [subscriptionSources, setSubscriptionSources] = useState([]);
    const [subscriptionPayments, setSubscriptionPayments] = useState([]);
    const [statusTracker, setStatusTracker] = useState({});

    // Veri yüklendi mi?
    const loadedRef = useRef(false);

    const migrateLegacyTrackers = useCallback(async (sources, payments, trackers) => {
        if (!sources || !sources.length || !trackers) return;

        const legacyPaidKeys = Object.keys(trackers).filter(key => {
            if (!trackers[key]) return false;
            const parts = key.split('_');
            if (parts.length !== 3) return false;
            const subId = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            return !isNaN(subId) && !isNaN(month) && !isNaN(year) && sources.some(s => s.id === subId);
        });

        if (!legacyPaidKeys.length) return;

        const paymentsToCreate = [];

        legacyPaidKeys.forEach(key => {
            const parts = key.split('_');
            const subId = parseInt(parts[0]);
            const monthIndex = parseInt(parts[1]); // 0-11
            const year = parseInt(parts[2]);
            const sub = sources.find(s => s.id === subId);
            const periodMonth = monthIndex + 1; // 1-12

            const exists = (payments || []).some(
                p => p.subscriptionId === subId && 
                p.periodYear === year && 
                p.periodMonth === periodMonth
            );

            if (!exists && sub) {
                const dueDay = sub.dayOfMonth || 1;
                const dueDate = `${year}-${String(periodMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
                paymentsToCreate.push({
                    subscriptionId: subId,
                    periodYear: year,
                    periodMonth,
                    expectedAmount: sub.amount,
                    actualAmount: sub.amount,
                    dueDate,
                    paidDate: dueDate,
                    isPaid: true,
                    note: 'Eski sistemden otomatik aktarıldı'
                });
            }
        });

        if (paymentsToCreate.length > 0) {
            console.log(`Migrating ${paymentsToCreate.length} legacy trackers inside client...`);
            try {
                const promises = paymentsToCreate.map(p => api.upsertSubscriptionPayment(p));
                const results = await Promise.all(promises);
                
                setSubscriptionPayments(prev => {
                    const next = [...prev];
                    results.forEach(saved => {
                        const exists = next.some(p => p.id === saved.id || (p.subscriptionId === saved.subscriptionId && p.periodYear === saved.periodYear && p.periodMonth === saved.periodMonth));
                        if (!exists) {
                            next.push(saved);
                        }
                    });
                    return next;
                });
                console.log("Legacy trackers migrated successfully!");
            } catch (err) {
                console.error("Failed to migrate legacy trackers on client:", err);
            }
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getAllData();
            setBanks(data.banks);
            setProducts(data.products);
            setPayments(data.payments);
            setIncomeSources(data.incomeSources);
            setExpenseSources(data.expenseSources);
            setSubscriptionSources(data.subscriptionSources);
            setSubscriptionPayments(data.subscriptionPayments || []);
            setStatusTracker(data.statusTracker); // merging status & sub trackers
            loadedRef.current = true;

            // Trigger client-side legacy migration
            migrateLegacyTrackers(data.subscriptionSources, data.subscriptionPayments || [], data.statusTracker);
        } catch (error) {
            console.error("Data fetch failed:", error);
            // alert?
        } finally {
            setLoading(false);
        }
    }, [migrateLegacyTrackers]);

    // --- BANKS ---
    const addBank = async (bank) => {
        const newItem = await api.createBank(bank);
        setBanks(prev => [...prev, newItem]);
        return newItem;
    };
    const editBank = async (id, updates) => {
        const updated = await api.updateBank(id, updates);
        setBanks(prev => prev.map(b => b.id === id ? updated : b));
        return updated;
    };
    const removeBank = async (id) => {
        await api.deleteBank(id);
        setBanks(prev => prev.filter(b => b.id !== id));
    };

    // --- PRODUCTS ---
    const addProduct = async (product) => {
        const newItem = await api.createProduct(product);
        setProducts(prev => [...prev, newItem]);
        return newItem;
    };
    const editProduct = async (id, updates) => {
        const updated = await api.updateProduct(id, updates);
        setProducts(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
    };
    const removeProduct = async (id) => {
        await api.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        // Cleanup payments related to this product (loans)
        await cleanPaymentsForProduct(id);
    };

    // --- PAYMENTS ---
    // Single payment upsert (e.g. tracking paid status manually or card amounts)
    const upsertPayment = async (payment) => {
        // Check if it's an existing payment (has a valid numeric id, not a virtual id like "virtual_9")
        const hasValidId = payment.id &&
            typeof payment.id === 'number' ||
            (typeof payment.id === 'string' && !payment.id.startsWith('virtual') && !isNaN(Number(payment.id)));

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
        setPayments(prev => [...prev, newItem]);
        return newItem;
    };
    const editPayment = async (id, updates) => {
        const updated = await api.updatePayment(id, updates);
        setPayments(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
    };
    const addPaymentsBulk = async (items) => {
        if (!items.length) return;
        const newItems = await api.createPaymentsBulk(items);
        setPayments(prev => [...prev, ...newItems]);
    };
    const cleanPaymentsForProduct = async (productId) => {
        await api.deletePaymentsByProductId(productId);
        setPayments(prev => prev.filter(p => p.productId !== productId));
    };

    // --- SOURCES (Income, Expense, Sub) ---
    const addSource = async (type, item) => {
        let newItem;
        if (type === 'income') {
            newItem = await api.createIncome(item);
            setIncomeSources(prev => [...prev, newItem]);
        } else if (type === 'expense') {
            newItem = await api.createExpense(item);
            setExpenseSources(prev => [...prev, newItem]);
        } else if (type === 'subscription') {
            newItem = await api.createSubscription(item);
            setSubscriptionSources(prev => [...prev, newItem]);
        }
        return newItem;
    };

    const updateSource = async (type, id, updates) => {
        let updated;
        if (type === 'income') {
            updated = await api.updateIncome(id, updates);
            setIncomeSources(prev => prev.map(i => i.id === id ? updated : i));
        } else if (type === 'expense') {
            updated = await api.updateExpense(id, updates);
            setExpenseSources(prev => prev.map(i => i.id === id ? updated : i));
        } else if (type === 'subscription') {
            updated = await api.updateSubscription(id, updates);
            setSubscriptionSources(prev => prev.map(i => i.id === id ? updated : i));
        }
        return updated;
    };

    const deleteSource = async (type, id) => {
        if (type === 'income') {
            await api.deleteIncome(id);
            setIncomeSources(prev => prev.filter(i => i.id !== id));
        } else if (type === 'expense') {
            await api.deleteExpense(id);
            setExpenseSources(prev => prev.filter(i => i.id !== id));
        } else if (type === 'subscription') {
            await api.deleteSubscription(id);
            setSubscriptionSources(prev => prev.filter(i => i.id !== id));
        }
    };

    // --- TRACKERS ---
    const toggleTracker = async (key, currentValue) => {
        // Optimistic update
        const newValue = !currentValue;
        setStatusTracker(prev => ({ ...prev, [key]: newValue }));

        try {
            await api.upsertTracker(key, newValue);
        } catch (err) {
            // Rollback
            setStatusTracker(prev => ({ ...prev, [key]: currentValue }));
            console.error('Tracker update failed', err);
        }
    };

    // --- SUBSCRIPTION PAYMENTS ---
    const saveSubscriptionPayment = async (payment) => {
        const saved = await api.upsertSubscriptionPayment(payment);
        setSubscriptionPayments(prev => {
            const exists = prev.some(p => p.id === saved.id || (p.subscriptionId === saved.subscriptionId && p.periodYear === saved.periodYear && p.periodMonth === saved.periodMonth));
            if (exists) {
                return prev.map(p => (p.id === saved.id || (p.subscriptionId === saved.subscriptionId && p.periodYear === saved.periodYear && p.periodMonth === saved.periodMonth)) ? saved : p);
            }
            return [...prev, saved];
        });
        return saved;
    };

    const markSubscriptionPaid = async (subscriptionId, year, month, actualAmount, paidDate, note, isPaid = true) => {
        const sub = subscriptionSources.find(s => s.id === subscriptionId);
        if (!sub) return;

        const existing = subscriptionPayments.find(p => p.subscriptionId === subscriptionId && p.periodYear === year && p.periodMonth === month);

        const payment = {
            ...(existing || {}),
            subscriptionId,
            periodYear: year,
            periodMonth: month,
            expectedAmount: sub.amount,
            actualAmount: actualAmount !== undefined && actualAmount !== null ? Number(actualAmount) : sub.amount,
            dueDate: existing?.dueDate || (sub.startDate ? `${year}-${String(month).padStart(2, '0')}-${String(sub.dayOfMonth || 1).padStart(2, '0')}` : null),
            paidDate: paidDate || new Date().toISOString().split('T')[0],
            isPaid,
            note: note !== undefined ? note : (existing?.note || '')
        };

        return saveSubscriptionPayment(payment);
    };

    const toggleSubscriptionPaid = async (subscriptionId, year, month, currentIsPaid) => {
        const sub = subscriptionSources.find(s => s.id === subscriptionId);
        if (!sub) return;

        const existing = subscriptionPayments.find(p => p.subscriptionId === subscriptionId && p.periodYear === year && p.periodMonth === month);
        const nextIsPaid = !currentIsPaid;

        const payment = {
            ...(existing || {}),
            subscriptionId,
            periodYear: year,
            periodMonth: month,
            expectedAmount: sub.amount,
            actualAmount: nextIsPaid ? sub.amount : null,
            dueDate: existing?.dueDate || (sub.startDate ? `${year}-${String(month).padStart(2, '0')}-${String(sub.dayOfMonth || 1).padStart(2, '0')}` : null),
            paidDate: nextIsPaid ? new Date().toISOString().split('T')[0] : null,
            isPaid: nextIsPaid
        };

        return saveSubscriptionPayment(payment);
    };

    // --- RESET ---
    const resetData = () => {
        setBanks([]);
        setProducts([]);
        setPayments([]);
        setIncomeSources([]);
        setExpenseSources([]);
        setSubscriptionSources([]);
        setSubscriptionPayments([]);
        setStatusTracker({});
        loadedRef.current = false;
    };

    const value = {
        loading,
        fetchData,
        resetData,

        banks,
        products,
        payments,
        incomeSources,
        expenseSources,
        subscriptionSources,
        subscriptionPayments,
        statusTracker,

        addBank, editBank, removeBank,
        addProduct, editProduct, removeProduct,
        addPayment, editPayment, upsertPayment, addPaymentsBulk, cleanPaymentsForProduct,

        addSource, updateSource, deleteSource,

        toggleTracker,
        saveSubscriptionPayment,
        markSubscriptionPaid,
        toggleSubscriptionPaid,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
