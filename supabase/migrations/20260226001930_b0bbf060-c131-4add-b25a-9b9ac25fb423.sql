
-- Fix update_user_premium_status to include 'pg_temp' in search_path
-- This prevents search_path injection attacks on SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.update_user_premium_status(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_has_active BOOLEAN;
BEGIN
  -- Check if user has any active subscription
  SELECT EXISTS(
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND is_active = true
      AND status = 'active'
      AND (end_date IS NULL OR end_date > NOW())
  ) INTO v_has_active;

  -- Update the profile
  UPDATE public.profiles
  SET is_premium = v_has_active,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_has_active;
END;
$$;
