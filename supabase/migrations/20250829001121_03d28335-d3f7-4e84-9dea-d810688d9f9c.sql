-- Test and fix the search functions to work without requiring authentication
-- The issue is that these functions check auth.uid() which is null when not logged in

-- Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS public.search_coach_by_username(text);
DROP FUNCTION IF EXISTS public.search_student_by_username(text);

-- Recreate search functions that work without authentication requirement
CREATE OR REPLACE FUNCTION public.search_coach_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT p.id, p.username, p.role::text
  FROM public.profiles p
  WHERE p.role = 'coach'
    AND p.is_active = true
    AND lower(p.username) = lower(p_username)
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.search_student_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT p.id, p.username, p.role::text
  FROM public.profiles p
  WHERE p.role = 'student'
    AND p.is_active = true
    AND lower(p.username) = lower(p_username)
  LIMIT 1
$function$;

-- Grant permissions again
GRANT EXECUTE ON FUNCTION public.search_coach_by_username(text) TO public;
GRANT EXECUTE ON FUNCTION public.search_student_by_username(text) TO public;