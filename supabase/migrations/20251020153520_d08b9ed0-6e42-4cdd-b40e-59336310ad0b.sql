-- Fix PUBLIC_USER_DATA: Require authentication for profile search functions

-- Update search_coach_by_username to require authentication
CREATE OR REPLACE FUNCTION public.search_coach_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.username, p.role::text
  FROM public.profiles p
  WHERE p.role = 'coach'
    AND p.is_active = true
    AND lower(p.username) = lower(p_username)
  LIMIT 1;
END;
$$;

-- Update search_student_by_username to require authentication
CREATE OR REPLACE FUNCTION public.search_student_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.username, p.role::text
  FROM public.profiles p
  WHERE p.role = 'student'
    AND p.is_active = true
    AND lower(p.username) = lower(p_username)
  LIMIT 1;
END;
$$;

-- Add defense-in-depth: require authentication for any SELECT on profiles
CREATE POLICY "require_auth_profiles_select"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add documentation
COMMENT ON POLICY "require_auth_profiles_select" ON public.profiles IS 
  'Defense-in-depth: Require authentication for any SELECT operation on profiles table';