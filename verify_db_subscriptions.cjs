
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zowlpzmvwiszwhtvsagj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvd2xwem12d2lzendodHZzYWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzkxNzQsImV4cCI6MjA4NTQxNTE3NH0.EROXjaXBHxH5phYC4l8lPl5f7xBXbRQ_rObqhh6vibM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSubs() {
    console.log("Checking 'subscription_sources'...");

    // Check Count
    const { count, error: countError } = await supabase
        .from('subscription_sources')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("Error counting:", countError);
    } else {
        console.log("Total Subscriptions:", count);
    }

    // Check Data
    const { data, error } = await supabase
        .from('subscription_sources')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log("Sample Data:", JSON.stringify(data, null, 2));
    }
}

checkSubs();
