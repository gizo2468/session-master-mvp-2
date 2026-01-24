-- Strengthen user_payments table security
-- Add restrictive authentication policy and revoke anonymous access

-- Add a RESTRICTIVE policy that requires authentication for ALL operations
-- This ensures that only authenticated users can interact with the user_payments table
CREATE POLICY "Require authentication for payments access"
ON public.user_payments
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke all access from anon role to prevent any anonymous access
REVOKE ALL ON public.user_payments FROM anon;