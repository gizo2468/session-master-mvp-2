-- Fix PUBLIC_USER_DATA: Drop overly permissive policy
-- This policy allowed ANY authenticated user to view ALL profiles
-- The existing specific policies already provide proper access control:
-- 1. Users can read own profile
-- 2. Coaches can view safe student profile data (approved connections only)
-- 3. Students can view safe coach profile data (approved connections only)

DROP POLICY IF EXISTS "require_auth_profiles_select" ON public.profiles;

-- Add documentation explaining the RLS strategy
COMMENT ON TABLE public.profiles IS 
  'RLS policies ensure users can only access: 
   1) Their own profile (policy: Users can read own profile)
   2) Profiles of users they have approved connections with as coach/student
   No general authenticated access policy is needed - specific policies provide proper access control.';
