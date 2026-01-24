-- Block anonymous/unauthenticated access to profiles table
-- This adds an explicit RESTRICTIVE policy that requires authentication
-- Combined with REVOKE, this ensures no anonymous access is possible

-- Add explicit blocking policy for anonymous users on SELECT
-- This policy ensures that auth.uid() must be set (user must be authenticated)
CREATE POLICY "Block anonymous SELECT on profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Add explicit blocking policy for anonymous users on INSERT
CREATE POLICY "Block anonymous INSERT on profiles"
ON public.profiles
AS RESTRICTIVE
FOR INSERT
TO anon
WITH CHECK (false);

-- Add explicit blocking policy for anonymous users on UPDATE
CREATE POLICY "Block anonymous UPDATE on profiles"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit blocking policy for anonymous users on DELETE
CREATE POLICY "Block anonymous DELETE on profiles"
ON public.profiles
AS RESTRICTIVE
FOR DELETE
TO anon
USING (false);

-- Ensure anon role has no grants (reinforcing previous REVOKE)
REVOKE ALL ON public.profiles FROM anon;