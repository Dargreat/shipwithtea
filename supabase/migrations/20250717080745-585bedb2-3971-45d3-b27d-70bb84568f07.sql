-- Update the handle_new_user function to support admin creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, company_name, api_key, is_admin)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone', 
    NEW.raw_user_meta_data->>'company_name',
    gen_random_uuid(),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  );
  RETURN NEW;
END;
$function$;