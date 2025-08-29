-- Fix RLS policies to prevent infinite recursion and handle null usernames
-- The issue is that INSERT policies are referencing the same table they're applied to

-- First, let's create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

CREATE OR REPLACE FUNCTION public.connection_exists(p_coach_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_student_connections
    WHERE coach_id = p_coach_id 
      AND student_id = p_student_id 
      AND status IN ('pending', 'approved')
  );
$function$;

-- Drop existing problematic INSERT policies
DROP POLICY IF EXISTS "Coaches can create connection requests" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Students can create connection requests" ON public.coach_student_connections;

-- Create new INSERT policies using security definer functions to avoid recursion
CREATE POLICY "Coaches can create connection requests" 
ON public.coach_student_connections 
FOR INSERT 
WITH CHECK (
  status = 'pending'
  AND auth.uid() IS NOT NULL
  AND auth.uid() = coach_id 
  AND public.get_user_role(coach_id) = 'coach'
  AND public.get_user_role(student_id) = 'student'
  AND NOT public.connection_exists(coach_id, student_id)
);

CREATE POLICY "Students can create connection requests" 
ON public.coach_student_connections 
FOR INSERT 
WITH CHECK (
  status = 'pending'
  AND auth.uid() IS NOT NULL
  AND auth.uid() = student_id 
  AND public.get_user_role(coach_id) = 'coach'
  AND public.get_user_role(student_id) = 'student'
  AND NOT public.connection_exists(coach_id, student_id)
);

-- Also fix username issues by ensuring all users have usernames
-- Update profiles where username is null to use a default pattern
UPDATE public.profiles 
SET username = 'user_' || substring(id::text from 1 for 8)
WHERE username IS NULL;