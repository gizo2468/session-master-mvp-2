-- Fix PUBLIC_USER_DATA and EXPOSED_SENSITIVE_DATA by explicitly blocking anonymous access
-- while keeping authenticated user access working

-- 1. Fix profiles table - Change policies from public to authenticated role
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate policies for authenticated users only
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add explicit deny for anonymous users
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 2. Fix user_private_data table - Remove problematic policy and add explicit deny
DROP POLICY IF EXISTS "Block direct access to others private data" ON public.user_private_data;
DROP POLICY IF EXISTS "Users can only access their own private data directly" ON public.user_private_data;

-- Add explicit deny for anonymous users
CREATE POLICY "Block anonymous access to private data"
ON public.user_private_data
FOR ALL
TO anon
USING (false);