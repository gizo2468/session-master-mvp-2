-- Fix profiles table RLS policies to properly enforce authentication
-- Drop the confusing "Block anonymous/public access" policies that use false conditions
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block public access to profiles" ON public.profiles;

-- Create a proper RESTRICTIVE policy that requires authentication for ALL operations
-- This ensures that only authenticated users can interact with the profiles table
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke all access from anon role to be extra safe
REVOKE ALL ON public.profiles FROM anon;