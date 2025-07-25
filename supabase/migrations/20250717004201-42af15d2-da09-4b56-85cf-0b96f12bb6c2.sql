-- Drop existing policies that are causing conflicts and recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create new non-recursive policies for profiles
CREATE POLICY "Allow users to view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Allow users to update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update orders policies to use the function instead of subquery
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Allow admins to view all orders" 
ON public.orders 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Allow admins to update all orders" 
ON public.orders 
FOR UPDATE 
USING (public.is_admin());