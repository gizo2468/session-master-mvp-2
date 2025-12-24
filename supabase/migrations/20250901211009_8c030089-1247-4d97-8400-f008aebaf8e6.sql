-- Create user_payments table to track all payment transactions
CREATE TABLE public.user_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'lifetime')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paypal_order_id TEXT,
  paypal_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_subscriptions table to track active subscriptions and entitlements
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'lifetime')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ, -- NULL for lifetime
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add is_premium column to profiles table for quick entitlement checking
ALTER TABLE public.profiles ADD COLUMN is_premium BOOLEAN DEFAULT false;

-- Enable Row Level Security
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_payments
CREATE POLICY "Users can view their own payments" 
ON public.user_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.user_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" 
ON public.user_payments 
FOR UPDATE 
USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX idx_user_payments_status ON public.user_payments(status);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON public.user_subscriptions(user_id, is_active, status);

-- Create function to update is_premium status
CREATE OR REPLACE FUNCTION public.update_user_premium_status(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_active_subscription BOOLEAN := false;
BEGIN
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_id = p_user_id 
      AND is_active = true 
      AND status = 'active'
      AND (end_date IS NULL OR end_date > now())
  ) INTO has_active_subscription;
  
  -- Update profiles table
  UPDATE profiles 
  SET is_premium = has_active_subscription 
  WHERE id = p_user_id;
  
  RETURN has_active_subscription;
END;
$$;

-- Create trigger to auto-update premium status when subscriptions change
CREATE OR REPLACE FUNCTION public.trigger_update_premium_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Update premium status for the affected user
  PERFORM update_user_premium_status(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_premium_status_on_subscription_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_premium_status();