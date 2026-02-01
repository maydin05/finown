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

// Generic CRUD helpers
const fetchTable = async (table, sortBy = 'created_at') => {
    const { data, error } = await supabase.from(table).select('*').order(sortBy, { ascending: true });
    if (error) throw error;
    return keysToCamel(data);
};


const insertItem = async (table, item) => {
    const user = await getUser();
    // Clean empty strings to null for date fields
    const cleanedItem = {};
    Object.keys(item).forEach(key => {
        // Skip 'id' field - let PostgreSQL auto-generate it
        if (key === 'id') return;
        const val = item[key];
        // Convert empty strings to null (especially for date fields)
        cleanedItem[key] = val === '' ? null : val;
    });
    const snakeItem = { ...keysToSnake(cleanedItem), user_id: user.id };
    const { data, error } = await supabase.from(table).insert(snakeItem).select().single();
    if (error) throw error;
    return keysToCamel(data);
};

const updateItem = async (table, id, updates) => {
    // Clean empty strings to null for date fields
    const cleanedUpdates = {};
    Object.keys(updates).forEach(key => {
        const val = updates[key];
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

// ...

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
        trackers
    ] = await Promise.all([
        fetchTable('banks'),
        fetchTable('products'),
        fetchTable('payments'),
        fetchTable('income_sources'),
        fetchTable('expense_sources'),
        fetchTable('subscription_sources'),
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

export const createSubscription = (item) => {
    // subscription_sources doesn't have 'category' column, so filter it out
    const { category, ...subscriptionData } = item;
    return insertItem('subscription_sources', subscriptionData);
};
export const updateSubscription = (id, updates) => {
    // subscription_sources doesn't have 'category' column, so filter it out
    const { category, ...subscriptionUpdates } = updates;
    return updateItem('subscription_sources', id, subscriptionUpdates);
};
export const deleteSubscription = (id) => deleteItem('subscription_sources', id);

// Payments (generated installments or manual payments)
export const createPayment = (item) => insertItem('payments', item);
export const updatePayment = (id, updates) => updateItem('payments', id, updates);
export const deletePayment = (id) => deleteItem('payments', id);
// Special bulk insert for loan installments
export const createPaymentsBulk = async (items) => {
    const user = await getUser();
    const snakeItems = items.map(i => ({ ...keysToSnake(i), user_id: user.id }));
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
    const snakeItems = items.map(i => ({ ...keysToSnake(i), user_id: user.id }));
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
