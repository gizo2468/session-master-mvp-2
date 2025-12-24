-- Add stack_check_interval column to profiles table
-- NULL means "Never", integer values represent minutes (15, 20, 25, 30, 45, 60)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stack_check_interval integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stack_check_interval IS 'Stack check reminder interval in minutes. NULL means disabled/never.';