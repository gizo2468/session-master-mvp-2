-- Security fix: tighten profiles table access and add safe lookup RPCs

-- 1) Remove overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view coach and student profiles" ON public.profiles;

-- 2) Replace broken connected profiles policy with precise ones
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;

-- Allow coaches to view student profiles for pending or approved connections
CREATE POLICY "Coaches can view pending or approved student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.coach_id = auth.uid()
      AND c.student_id = profiles.id
      AND c.status IN ('approved','pending')
  )
);

-- Allow students to view coach profiles only for approved connections
CREATE POLICY "Students can view approved coach profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.student_id = auth.uid()
      AND c.coach_id = profiles.id
      AND c.status = 'approved'
  )
);

-- Keep existing self-access policy as-is (not recreated here):
--   "Users can read own profile" FOR SELECT USING (auth.uid() = id)

-- 3) Safe username lookups via RPC (limit fields and require auth)
CREATE OR REPLACE FUNCTION public.search_coach_by_username(p_username text)
RETURNS TABLE (id uuid, username text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, role
  FROM public.profiles
  WHERE role = 'coach'
    AND lower(username) = lower(p_username)
    AND auth.uid() IS NOT NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.search_student_by_username(p_username text)
RETURNS TABLE (id uuid, username text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, role
  FROM public.profiles
  WHERE role = 'student'
    AND lower(username) = lower(p_username)
    AND auth.uid() IS NOT NULL
  LIMIT 1
$$;

-- 4) Safe availability checks for signup (boolean only)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(p_username)
  ) AND auth.uid() IS NULL -- only meaningful pre-auth; still safe either way
$$;

CREATE OR REPLACE FUNCTION public.check_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Returns true if email is not found in profiles; does not expose the email itself
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(email) = lower(p_email)
  ) AND auth.uid() IS NULL -- typically called before signup; remains safe for auth too
$$;