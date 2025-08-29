-- Fix check_email_available function to query the correct table
-- The function was looking for email in profiles table but email was moved to user_private_data table

DROP FUNCTION IF EXISTS public.check_email_available(text);

CREATE OR REPLACE FUNCTION public.check_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_private_data
    WHERE lower(email) = lower(p_email)
  )
$function$;