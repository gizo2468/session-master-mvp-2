-- Fix overly permissive RLS policies

-- 1. Fix user_subscriptions: "System can update subscriptions" using true
-- This policy should only allow service role (edge functions) to update, not regular users
-- Drop the permissive policy
DROP POLICY IF EXISTS "System can update subscriptions" ON user_subscriptions;

-- Create a more restrictive policy: Users can only update their own subscriptions (status field for cancellation)
-- Edge functions use service role which bypasses RLS, so they don't need this policy
CREATE POLICY "Users can update their own subscriptions" 
ON user_subscriptions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix security_audit_log: "System can insert audit logs" using true
-- Audit logs should only be insertable by database triggers (which run as table owner) 
-- or service role, not by regular authenticated users
DROP POLICY IF EXISTS "System can insert audit logs" ON security_audit_log;

-- Note: Database triggers bypass RLS when executed as SECURITY DEFINER
-- If edge functions need to insert, they use service role which bypasses RLS
-- No policy needed for authenticated users to insert audit logs (they shouldn't be able to)