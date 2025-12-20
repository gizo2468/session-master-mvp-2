-- Fix security definer warning by setting view to use invoker security
-- This ensures the view respects the RLS policies of the querying user
ALTER VIEW public.user_with_subscription_status SET (security_invoker = on);