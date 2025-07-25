-- Add currency support to pricing table
ALTER TABLE public.pricing 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN naira_price_per_kg NUMERIC,
ADD COLUMN naira_base_price NUMERIC;

-- Add check constraint for currency
ALTER TABLE public.pricing 
ADD CONSTRAINT pricing_currency_check 
CHECK (currency IN ('USD', 'NGN'));

-- Update existing orders table to support dual currency
ALTER TABLE public.orders
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN naira_cost NUMERIC;

-- Add check constraint for orders currency
ALTER TABLE public.orders 
ADD CONSTRAINT orders_currency_check 
CHECK (currency IN ('USD', 'NGN'));