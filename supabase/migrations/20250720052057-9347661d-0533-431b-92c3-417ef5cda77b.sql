
-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text;

-- Make username unique and required
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL;

-- Add username validation (alphanumeric and underscores only, 3-20 characters)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Update the handle_new_user function to include username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    username,
    role,
    coach_tier,
    language,
    notification_preferences,
    is_active,
    has_accepted_terms,
    has_seen_tutorial,
    has_completed_tutorial
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN COALESCE(new.raw_user_meta_data->>'role', 'student') = 'coach' 
      THEN COALESCE(new.raw_user_meta_data->>'coachTier', 'free')
      ELSE NULL
    END,
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    COALESCE(
      new.raw_user_meta_data->'notificationPreferences', 
      '{"newFeedback": true, "liveSessionStart": true}'::jsonb
    ),
    true,
    COALESCE((new.raw_user_meta_data->>'hasAcceptedTerms')::boolean, false),
    false,
    false
  );
  RETURN new;
END;
$$;

-- Create a function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(username_to_check)
  );
$$;
