-- Update the handle_new_user function to ensure proper profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, company_name, api_key)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone', 
    NEW.raw_user_meta_data->>'company_name',
    gen_random_uuid()
  );
  RETURN NEW;
END;
$$;

-- Disable email confirmation for faster development (can be re-enabled in production)
-- Note: This setting change is done via SQL but may require Supabase dashboard configuration