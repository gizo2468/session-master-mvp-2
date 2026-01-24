-- Fix profiles table RLS: Remove overly broad policy and keep specific access controls
-- The existing policies properly scope access:
-- 1. Users can read/update/insert their own profile (auth.uid() = id)
-- 2. Coaches can view connected students' profiles
-- 3. Students can view connected coaches' profiles

-- Drop the overly broad "Require authentication for profiles access" policy
-- that allows ANY authenticated user to access ALL profiles
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- Ensure anon role has no access
REVOKE ALL ON public.profiles FROM anon;

-- The existing policies already properly restrict access:
-- "Users can read own profile" - SELECT with auth.uid() = id
-- "Users can update own profile" - UPDATE with auth.uid() = id  
-- "Users can insert own profile" - INSERT with auth.uid() = id
-- "Coaches can view safe student profile data" - SELECT for approved connections
-- "Students can view safe coach profile data" - SELECT for approved connections

-- Fix user_payments: Drop overly broad policy and rely on existing user_id scoped policies
DROP POLICY IF EXISTS "Require authentication for payments access" ON public.user_payments;

-- Ensure anon has no access to payments
REVOKE ALL ON public.user_payments FROM anon;

-- The existing policies properly scope access:
-- "Users can insert their own payments" - INSERT with auth.uid() = user_id
-- "Users can view their own payments" - SELECT with auth.uid() = user_id