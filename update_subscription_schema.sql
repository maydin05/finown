-- 1. Alter subscription_sources to add is_variable column
ALTER TABLE public.subscription_sources 
    ADD COLUMN is_variable boolean DEFAULT false;

-- 2. Create subscription_payments table
CREATE TABLE public.subscription_payments (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    subscription_id bigint REFERENCES public.subscription_sources(id) ON DELETE CASCADE NOT NULL,
    
    -- Period details
    period_year integer NOT NULL,          -- e.g. 2026
    period_month integer NOT NULL,         -- e.g. 1 to 12
    
    -- Payment details
    expected_amount numeric DEFAULT 0,     -- Expected amount copied from subscription source
    actual_amount numeric DEFAULT NULL,    -- Actual amount paid (NULL means not set/paid yet)
    due_date date,                         -- Due date for this period
    paid_date date DEFAULT NULL,           -- Actual date paid
    is_paid boolean DEFAULT false,
    
    note text,                             -- Period-based custom note
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    UNIQUE(subscription_id, period_year, period_month)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Policies for subscription_payments" ON public.subscription_payments 
    FOR ALL USING (auth.uid() = user_id);
