-- ============================================
-- ADD EXPLICIT DENY POLICIES FOR PROFILES TABLE
-- Block anonymous and public access to profiles
-- ============================================

-- Add explicit deny policy for anonymous users
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit deny policy for public role
DROP POLICY IF EXISTS "Block public access to profiles" ON public.profiles;

CREATE POLICY "Block public access to profiles"
ON public.profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Verify grants are revoked
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Document the security model
COMMENT ON TABLE public.profiles IS 
  'User profiles table with RLS protection:
   - Anonymous users: BLOCKED by explicit deny policies
   - Public role: BLOCKED by explicit deny policies
   - Authenticated users: Can access own profile and connected coach/student profiles
   - Contains: username, role, bio, coaching info, preferences';