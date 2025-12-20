-- Create a read-only VIEW combining user_private_data with subscription status
-- This does NOT modify any existing tables, columns, or RLS policies

CREATE VIEW public.user_with_subscription_status AS
SELECT 
  upd.id AS user_id,
  upd.email,
  upd.full_name,
  EXISTS (
    SELECT 1 
    FROM public.user_subscriptions us 
    WHERE us.user_id = upd.id 
      AND us.is_active = true
      AND us.status = 'active'
      AND (us.end_date IS NULL OR us.end_date > now())
  ) AS has_subscription
FROM public.user_private_data upd;