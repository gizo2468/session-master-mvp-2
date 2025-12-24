-- Fix security vulnerability: Replace overly broad payment update policy
-- Remove the insecure "System can update payments" policy that allows any update
DROP POLICY IF EXISTS "System can update payments" ON public.user_payments;

-- Create a secure policy that only allows service role to update payment status 
-- and PayPal transaction details for legitimate payment processing
CREATE POLICY "Service role can update payment processing fields" 
ON public.user_payments 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Create a policy to allow authenticated users to update their own payment records
-- but only for non-critical fields (prevents tampering with payment amounts/status)
CREATE POLICY "Users can update their own non-critical payment fields" 
ON public.user_payments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  -- Users can only update their own payments
  auth.uid() = user_id AND
  -- Prevent users from modifying critical payment fields
  -- Only the service role should be able to update these
  (OLD.status IS NOT DISTINCT FROM NEW.status) AND
  (OLD.amount IS NOT DISTINCT FROM NEW.amount) AND
  (OLD.paypal_order_id IS NOT DISTINCT FROM NEW.paypal_order_id) AND
  (OLD.paypal_payment_id IS NOT DISTINCT FROM NEW.paypal_payment_id) AND
  (OLD.plan_type IS NOT DISTINCT FROM NEW.plan_type)
);

-- Add audit logging for payment updates to track any changes
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

-- Create trigger to automatically log payment updates
DROP TRIGGER IF EXISTS payment_update_audit ON public.user_payments;
CREATE TRIGGER payment_update_audit
  AFTER UPDATE ON public.user_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_update();