-- Allow admins to update all profiles (needed for admin management)
CREATE POLICY "Allow admins to update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin()) 
WITH CHECK (is_admin());