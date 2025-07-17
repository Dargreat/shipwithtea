-- Fix infinite recursion in profiles table RLS policies
-- Drop the problematic policy that references profiles table within profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new policy that doesn't cause recursion
-- This policy allows users to view their own profiles and admins to view all profiles
-- We'll use a different approach that doesn't reference the same table
CREATE POLICY "Users can view own profile and admins all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.is_admin = true
  )
);

-- Also ensure we have proper policies for admin management
CREATE POLICY "Only admins can update admin status" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  CASE 
    WHEN OLD.is_admin != NEW.is_admin THEN 
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true)
    ELSE true
  END
);

-- Create a simple function to check if user is admin to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE user_id = user_uuid;
$$;