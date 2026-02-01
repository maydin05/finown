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
    const [statusTracker, setStatusTracker] = useState({});

    // Veri yüklendi mi?
    const loadedRef = useRef(false);

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
            setStatusTracker(data.statusTracker); // merging status & sub trackers
            loadedRef.current = true;
        } catch (error) {
            console.error("Data fetch failed:", error);
            // alert?
        } finally {
            setLoading(false);
        }
    }, []);

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

    // --- RESET ---
    const resetData = () => {
        setBanks([]);
        setProducts([]);
        setPayments([]);
        setIncomeSources([]);
        setExpenseSources([]);
        setSubscriptionSources([]);
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
        statusTracker,

        addBank, editBank, removeBank,
        addProduct, editProduct, removeProduct,
        addPayment, editPayment, upsertPayment, addPaymentsBulk, cleanPaymentsForProduct,

        addSource, updateSource, deleteSource,

        toggleTracker,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
