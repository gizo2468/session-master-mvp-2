-- ============================================
-- FIX CRITICAL RLS SECURITY ISSUES
-- Fix PUBLIC_USER_DATA, EXPOSED_SENSITIVE_DATA, MISSING_RLS_PROTECTION
-- ============================================

-- ============================================
-- 1. FIX PROFILES TABLE (PUBLIC_USER_DATA)
-- ============================================

-- Remove the useless blocking policy that uses 'false'
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Revoke all grants from anon and public roles to prevent anonymous access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Grant only necessary permissions to authenticated users
-- The existing RLS policies will further restrict access to:
-- - Own profile
-- - Connected coach/student profiles only
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ============================================
-- 2. FIX USER_PRIVATE_DATA TABLE (EXPOSED_SENSITIVE_DATA)
-- ============================================

-- Remove the useless blocking policy that uses 'false'
DROP POLICY IF EXISTS "Block anonymous access to private data" ON public.user_private_data;

-- Revoke all grants from anon and public roles
REVOKE ALL ON public.user_private_data FROM anon;
REVOKE ALL ON public.user_private_data FROM public;

-- Grant only necessary permissions to authenticated users
-- The existing "Users can only access their own private data" policy
-- will restrict to owner-only access
GRANT SELECT, INSERT, UPDATE ON public.user_private_data TO authenticated;

-- ============================================
-- 3. FIX USER_PAYMENTS TABLE (MISSING_RLS_PROTECTION)
-- ============================================

-- Remove the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can update payment records" ON public.user_payments;

-- Revoke all grants from anon and public roles
REVOKE ALL ON public.user_payments FROM anon;
REVOKE ALL ON public.user_payments FROM public;

-- Revoke UPDATE permission from authenticated users
-- Only backend services (via service role) can update payments
REVOKE UPDATE ON public.user_payments FROM authenticated;

-- Grant only SELECT and INSERT to authenticated users
-- Existing policies ensure users can only access their own payments
GRANT SELECT, INSERT ON public.user_payments TO authenticated;

-- Add documentation
COMMENT ON TABLE public.user_payments IS 
  'Payment records security model:
   - Users can INSERT their own payments and SELECT their own records
   - Users CANNOT update or delete payments (prevents fraud)
   - Backend edge functions use service role (bypasses RLS) to update payment status
   - Anonymous users have NO access';

COMMENT ON TABLE public.profiles IS 
  'Profile access security model:
   - Anonymous users have NO access
   - Authenticated users can access: their own profile + approved coach/student connections
   - RLS policies enforce connection-based access control';

COMMENT ON TABLE public.user_private_data IS 
  'Private data security model:
   - Anonymous users have NO access
   - Authenticated users can ONLY access their own record
   - Contains sensitive PII: email, phone, address, DOB';