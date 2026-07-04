import { supabase } from '../lib/supabase';

// Helper to get current user
const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    return user;
};

// --- Helpers for Snake <-> Camel conversion ---
const toCamel = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const keysToCamel = (obj) => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(keysToCamel);
    }
    const n = {};
    Object.keys(obj).forEach((k) => {
        n[toCamel(k)] = keysToCamel(obj[k]);
    });
    return n;
};

const keysToSnake = (obj) => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(keysToSnake);
    }
    const n = {};
    Object.keys(obj).forEach((k) => {
        n[toSnake(k)] = keysToSnake(obj[k]);
    });
    return n;
};

// Database schema allowed columns mapping (camelCase)
const ALLOWED_COLUMNS = {
    banks: ['name', 'color'],
    products: [
        'bankId', 'type', 'name', 'cardType', 'last4Digits', 'limit',
        'cutoffDay', 'paymentDueDay', 'parentCardId', 'total', 'remaining',
        'installment', 'totalInstallments', 'startDate', 'installmentAmount',
        'firstPaymentDate'
    ],
    payments: [
        'productId', 'title', 'subtitle', 'amount', 'dueDate', 'type',
        'isPaid', 'isManual'
    ],
    income_sources: [
        'title', 'amount', 'type', 'category', 'date', 'startDate',
        'dayOfMonth', 'endDate', 'note'
    ],
    expense_sources: [
        'title', 'amount', 'type', 'category', 'date', 'startDate',
        'dayOfMonth', 'endDate', 'note'
    ],
    subscription_sources: [
        'title', 'amount', 'type', 'date', 'startDate', 'dayOfMonth',
        'endDate', 'paymentMethodType', 'paymentMethodValue', 'relatedCardId',
        'note', 'isVariable', 'billingCycle'
    ],
    subscription_payments: [
        'subscriptionId', 'periodYear', 'periodMonth', 'expectedAmount',
        'actualAmount', 'dueDate', 'paidDate', 'isPaid', 'note'
    ],
    trackers: ['key', 'value']
};

// Filter object fields to only allow those matching database columns
const filterTableFields = (table, obj) => {
    const allowed = ALLOWED_COLUMNS[table];
    if (!allowed) return obj;
    const filtered = {};
    Object.keys(obj).forEach(key => {
        if (allowed.includes(key) || key === 'id') {
            filtered[key] = obj[key];
        }
    });
    return filtered;
};

// Generic CRUD helpers
const fetchTable = async (table, sortBy = 'created_at') => {
    const { data, error } = await supabase.from(table).select('*').order(sortBy, { ascending: true });
    if (error) throw error;
    return keysToCamel(data);
};


const insertItem = async (table, item) => {
    const user = await getUser();
    const filteredItem = filterTableFields(table, item);
    // Clean empty strings to null for date fields
    const cleanedItem = {};
    Object.keys(filteredItem).forEach(key => {
        // Skip 'id' field - let PostgreSQL auto-generate it
        if (key === 'id') return;
        const val = filteredItem[key];
        // Convert empty strings to null (especially for date fields)
        cleanedItem[key] = val === '' ? null : val;
    });
    const snakeItem = { ...keysToSnake(cleanedItem), user_id: user.id };
    const { data, error } = await supabase.from(table).insert(snakeItem).select().single();
    if (error) throw error;
    return keysToCamel(data);
};

const updateItem = async (table, id, updates) => {
    const filteredUpdates = filterTableFields(table, updates);
    // Clean empty strings to null for date fields
    const cleanedUpdates = {};
    Object.keys(filteredUpdates).forEach(key => {
        const val = filteredUpdates[key];
        cleanedUpdates[key] = val === '' ? null : val;
    });
    const snakeUpdates = keysToSnake(cleanedUpdates);
    const { data, error } = await supabase.from(table).update(snakeUpdates).eq('id', id).select().single();
    if (error) throw error;
    return keysToCamel(data);
};

const deleteItem = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
};

// --- Initial Bulk Fetch ---
export const getAllData = async () => {
    await getUser(); // Ensure logged in

    const [
        banks,
        products,
        payments,
        incomeSources,
        expenseSources,
        subscriptionSources,
        subscriptionPayments,
        trackers
    ] = await Promise.all([
        fetchTable('banks'),
        fetchTable('products'),
        fetchTable('payments'),
        fetchTable('income_sources'),
        fetchTable('expense_sources'),
        fetchTable('subscription_sources'),
        fetchTable('subscription_payments').catch(err => {
            console.warn("Could not fetch subscription_payments (table may not exist yet):", err.message);
            return [];
        }),
        fetchTable('trackers', 'key') // Trackers doesn't have created_at
    ]);

    // Trackers table: key, value -> Object map
    const statusTracker = {};
    const subscriptionTracker = {};

    trackers.forEach(t => {
        // Tracker logic: keys usually "monthKey"
        // Let's assume all trackers are mixed or we have a 'type' column?
        // In the schema, I only created 'trackers' table.
        // Let's assume frontend manages keys uniquely.
        // For simplicity, we just dump all into statusTracker
        // But the legacy code had 2 separate objects.
        // We can just use one map for both since keys are usually unique strings.
        // Or if we need to separate, we check the key format.
        statusTracker[t.key] = t.value;
    });

    return {
        banks,
        products,
        payments,
        incomeSources,
        expenseSources,
        subscriptionSources,
        subscriptionPayments,
        statusTracker,
        subscriptionTracker: statusTracker,
    };
};

// --- Specific API Exports ---

// Banks
export const createBank = (item) => insertItem('banks', item);
export const updateBank = (id, updates) => updateItem('banks', id, updates);
export const deleteBank = (id) => deleteItem('banks', id);

// Products
export const createProduct = (item) => insertItem('products', item);
export const updateProduct = (id, updates) => updateItem('products', id, updates);
export const deleteProduct = (id) => deleteItem('products', id);

// Sources
export const createIncome = (item) => insertItem('income_sources', item);
export const updateIncome = (id, updates) => updateItem('income_sources', id, updates);
export const deleteIncome = (id) => deleteItem('income_sources', id);

export const createExpense = (item) => insertItem('expense_sources', item);
export const updateExpense = (id, updates) => updateItem('expense_sources', id, updates);
export const deleteExpense = (id) => deleteItem('expense_sources', id);

export const createSubscription = (item) => insertItem('subscription_sources', item);
export const updateSubscription = (id, updates) => updateItem('subscription_sources', id, updates);
export const deleteSubscription = (id) => deleteItem('subscription_sources', id);

// Subscription Payments
export const createSubscriptionPayment = (item) => insertItem('subscription_payments', item);
export const updateSubscriptionPayment = (id, updates) => updateItem('subscription_payments', id, updates);
export const deleteSubscriptionPayment = (id) => deleteItem('subscription_payments', id);
export const upsertSubscriptionPayment = async (item) => {
    const user = await getUser();
    const filtered = filterTableFields('subscription_payments', item);
    const snakeItem = { ...keysToSnake(filtered), user_id: user.id };
    const { data, error } = await supabase
        .from('subscription_payments')
        .upsert(snakeItem, { onConflict: 'subscription_id,period_year,period_month' })
        .select()
        .single();
    if (error) throw error;
    return keysToCamel(data);
};

// Payments (generated installments or manual payments)
export const createPayment = (item) => insertItem('payments', item);
export const updatePayment = (id, updates) => updateItem('payments', id, updates);
export const deletePayment = (id) => deleteItem('payments', id);
// Special bulk insert for loan installments
export const createPaymentsBulk = async (items) => {
    const user = await getUser();
    const snakeItems = items.map(i => {
        const filtered = filterTableFields('payments', i);
        return { ...keysToSnake(filtered), user_id: user.id };
    });
    const { data, error } = await supabase.from('payments').insert(snakeItems).select();
    if (error) throw error;
    return keysToCamel(data);
};
export const deletePaymentsByProductId = async (productId) => {
    const { error } = await supabase.from('payments').delete().eq('product_id', productId);
    if (error) throw error;
    return true;
};

// Bulk Upsert for Migration
export const bulkUpsert = async (table, items) => {
    const user = await getUser();
    const snakeItems = items.map(i => {
        const filtered = filterTableFields(table, i);
        return { ...keysToSnake(filtered), user_id: user.id };
    });
    const { data, error } = await supabase.from(table).upsert(snakeItems).select();
    if (error) throw error;
    return keysToCamel(data);
};


// Trackers (Upsert logic mostly)
export const upsertTracker = async (key, value) => {
    const user = await getUser();
    // Check if exists
    const { data: existing } = await supabase.from('trackers').select('id').eq('key', key).single();

    if (existing) {
        return updateItem('trackers', existing.id, { value });
    } else {
        return insertItem('trackers', { key, value });
    }
};
