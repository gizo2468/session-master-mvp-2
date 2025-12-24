-- Add username column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text;

-- Add unique constraint for username
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_username_unique UNIQUE (username);

-- Add format validation constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$');

-- Update the handle_new_user function to require username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_username text;
BEGIN
  -- Extract username from metadata
  user_username := new.raw_user_meta_data->>'username';
  
  -- Enforce username as required
  IF COALESCE(user_username, '') = '' THEN
    RAISE EXCEPTION 'Username is required and must be provided during signup.';
  END IF;
  
  -- Validate username format (3-20 chars, alphanumeric and underscores only)
  IF NOT (user_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-20 characters and contain only letters, numbers, and underscores.';
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = user_username) THEN
    RAISE EXCEPTION 'Username "%" is already taken. Please choose a different username.', user_username;
  END IF;

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
    user_username, -- Now guaranteed to be non-null and valid
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

-- Make username column NOT NULL to enforce at schema level
-- Only do this if no existing rows have NULL usernames
DO $$
BEGIN
  -- Only set NOT NULL if all existing usernames are valid
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username IS NULL OR username = '') THEN
    ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;