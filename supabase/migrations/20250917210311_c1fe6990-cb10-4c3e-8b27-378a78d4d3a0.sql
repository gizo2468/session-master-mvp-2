-- Fix security vulnerability: Replace overly broad payment update policy
-- Remove the insecure "System can update payments" policy that allows any update
DROP POLICY IF EXISTS "System can update payments" ON public.user_payments;

-- Create a secure policy that only allows service role to update payment records
-- This restricts payment updates to only legitimate payment processing operations
CREATE POLICY "Service role can update payment records" 
ON public.user_payments 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Add audit logging function for payment updates
CREATE OR REPLACE FUNCTION public.log_payment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log payment updates for security monitoring
  PERFORM log_security_event(
    'payment_update',
    'user_payments',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically log payment updates for security monitoring
DROP TRIGGER IF EXISTS payment_update_audit ON public.user_payments;
CREATE TRIGGER payment_update_audit
  AFTER UPDATE ON public.user_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_update();