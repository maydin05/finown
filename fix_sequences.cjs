require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSequences() {
    console.log('Fixing PostgreSQL sequences for all tables...\n');

    const tables = [
        'banks',
        'products',
        'payments',
        'income_sources',
        'expense_sources',
        'subscription_sources'
    ];

    for (const table of tables) {
        try {
            // Get the maximum ID from the table
            const { data, error } = await supabase
                .from(table)
                .select('id')
                .order('id', { ascending: false })
                .limit(1);

            if (error) {
                console.error(`Error fetching max ID for ${table}:`, error.message);
                continue;
            }

            const maxId = data && data.length > 0 ? data[0].id : 0;
            console.log(`Table: ${table}, Max ID: ${maxId}`);

            // Note: We cannot run raw SQL via supabase-js client.
            // You need to run this SQL in Supabase Dashboard SQL Editor:
            console.log(`  -> Run in SQL Editor: SELECT setval('${table}_id_seq', ${maxId + 1}, false);`);

        } catch (err) {
            console.error(`Error processing ${table}:`, err.message);
        }
    }

    console.log('\n=== IMPORTANT ===');
    console.log('Please run the following SQL commands in Supabase Dashboard -> SQL Editor:\n');
    console.log(`
-- Fix all table sequences
SELECT setval('banks_id_seq', COALESCE((SELECT MAX(id) FROM banks), 0) + 1, false);
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1, false);
SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM payments), 0) + 1, false);
SELECT setval('income_sources_id_seq', COALESCE((SELECT MAX(id) FROM income_sources), 0) + 1, false);
SELECT setval('expense_sources_id_seq', COALESCE((SELECT MAX(id) FROM expense_sources), 0) + 1, false);
SELECT setval('subscription_sources_id_seq', COALESCE((SELECT MAX(id) FROM subscription_sources), 0) + 1, false);
    `);
}

fixSequences();
