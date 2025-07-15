-- ShipWithTosin Database Schema

-- Update profiles table to include admin flag and API key
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS api_key TEXT DEFAULT generate_random_uuid()::text,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ship_from TEXT NOT NULL,
  ship_to TEXT NOT NULL,
  weight DECIMAL NOT NULL,
  package_type TEXT,
  estimated_cost DECIMAL,
  status TEXT DEFAULT 'pending',
  from_address TEXT,
  to_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing table for rate cards
CREATE TABLE IF NOT EXISTS public.pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  package_type TEXT NOT NULL,
  price_per_kg DECIMAL NOT NULL,
  base_price DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for pricing (public read, admin write)
CREATE POLICY "Anyone can view pricing" 
ON public.pricing 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage pricing" 
ON public.pricing 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for blog posts
CREATE POLICY "Anyone can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (published = true);

CREATE POLICY "Admins can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, api_key)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', gen_random_uuid()::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample pricing data
INSERT INTO public.pricing (from_country, to_country, package_type, price_per_kg, base_price) VALUES
('Nigeria', 'Ghana', 'Documents', 15.00, 5.00),
('Nigeria', 'Ghana', 'Packages', 25.00, 10.00),
('Nigeria', 'USA', 'Documents', 35.00, 15.00),
('Nigeria', 'USA', 'Packages', 45.00, 20.00),
('Nigeria', 'UK', 'Documents', 30.00, 12.00),
('Nigeria', 'UK', 'Packages', 40.00, 18.00),
('Ghana', 'Nigeria', 'Documents', 15.00, 5.00),
('Ghana', 'Nigeria', 'Packages', 25.00, 10.00)
ON CONFLICT DO NOTHING;