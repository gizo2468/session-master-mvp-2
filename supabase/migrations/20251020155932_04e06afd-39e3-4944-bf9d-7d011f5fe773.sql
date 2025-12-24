-- ============================================
-- STRENGTHEN RLS FOR USER_PRIVATE_DATA
-- Ensure complete anonymous blocking with FORCE RLS
-- ============================================

-- Enable RLS (should already be enabled, but ensure it)
ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner and all roles (no bypass for anyone except service_role)
ALTER TABLE public.user_private_data FORCE ROW LEVEL SECURITY;

-- Add explicit deny policy for anonymous users (defense in depth)
-- This blocks all operations for non-authenticated users
DROP POLICY IF EXISTS "Block all anonymous access to private data" ON public.user_private_data;

CREATE POLICY "Block all anonymous access to private data"
ON public.user_private_data
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit deny policy for public role
DROP POLICY IF EXISTS "Block all public access to private data" ON public.user_private_data;

CREATE POLICY "Block all public access to private data"
ON public.user_private_data
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Verify grants (should already be revoked, but double-check)
REVOKE ALL ON public.user_private_data FROM anon;
REVOKE ALL ON public.user_private_data FROM public;

-- Document the security model
COMMENT ON TABLE public.user_private_data IS 
  'CRITICAL PII TABLE - Maximum security:
   - RLS ENABLED and FORCED (no bypass except service_role)
   - Anonymous users: BLOCKED by explicit deny policies + no grants
   - Public role: BLOCKED by explicit deny policies + no grants
   - Authenticated users: Owner-only access via "Users can only access their own private data" policy
   - Contains: email, phone_number, full_name, address, date_of_birth, profile_picture';