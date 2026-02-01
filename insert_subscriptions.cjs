
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zowlpzmvwiszwhtvsagj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvd2xwem12d2lzendodHZzYWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzkxNzQsImV4cCI6MjA4NTQxNTE3NH0.EROXjaXBHxH5phYC4l8lPl5f7xBXbRQ_rObqhh6vibM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const subscriptionSources = [
    { id: 1, title: "Netflix", amount: 60, type: "recurring", startDate: "2026-01-20", dayOfMonth: 20, endDate: "2027-01-20", relatedCardId: null, note: "Google Play", paymentMethodType: "manual", paymentMethodValue: "Google Play" },
    { id: 2, title: "Ev internet", amount: 870, type: "recurring", startDate: "2026-01-16", dayOfMonth: 16, endDate: "2027-01-16", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" },
    { id: 3, title: "İSKİ SU", amount: 500, type: "recurring", startDate: "2026-01-29", dayOfMonth: 29, endDate: "2026-01-29", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" },
    { id: 4, title: "Hacer cep", amount: 350, type: "recurring", startDate: "2025-12-30", dayOfMonth: 30, endDate: "2026-01-30", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" },
    { id: 5, title: "İgdaş doğalgaz", amount: 700, type: "recurring", startDate: "2025-12-29", dayOfMonth: 29, endDate: "2026-01-29", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" },
    { id: 6, title: "Enerjisi elektirik", amount: 500, type: "recurring", startDate: "2025-12-29", dayOfMonth: 29, endDate: "2026-01-29", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" },
    { id: 7, title: "Mehmet cep", amount: 700, type: "recurring", startDate: "2025-12-08", dayOfMonth: 8, endDate: "2026-01-08", relatedCardId: 4, note: "", paymentMethodType: "bank", paymentMethodValue: "2" }
];

async function insertData() {
    console.log("Preparing data with snake_case fields...");

    // Convert to snake_case for Supabase
    const payload = subscriptionSources.map(s => ({
        id: s.id,
        title: s.title,
        amount: s.amount,
        type: s.type,
        start_date: s.startDate,
        day_of_month: s.dayOfMonth,
        end_date: s.endDate,
        related_card_id: s.relatedCardId,
        note: s.note,
        payment_method_type: s.paymentMethodType,
        payment_method_value: s.paymentMethodValue
    }));

    console.log("Inserting...");
    const { data, error } = await supabase
        .from('subscription_sources')
        .upsert(payload, { onConflict: 'id' })
        .select();

    if (error) {
        console.error("Error inserting:", error);
    } else {
        console.log("Success! Inserted rows:", data.length);
    }
}

insertData();
