
-- Fix handle_new_user trigger: STOP inserting into user_roles
-- Role assignment is handled by edge functions (create-teacher, create-employee, create-parent)
-- This prevents duplicate role entries

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile only — role is assigned by the edge function that created this user
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  RETURN NEW;
END;
$function$;
