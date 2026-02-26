
-- Drop overly permissive UPDATE policies that allow any authenticated user
-- to modify any payment or subscription record.
-- Edge functions use service role (which bypasses RLS), so no UPDATE policy is needed.
-- Client-side code only uses upsert on user_subscriptions (covered by INSERT policy).

DROP POLICY IF EXISTS "System can update payments" ON public.user_payments;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.user_subscriptions;
