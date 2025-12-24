-- Update handle_new_user function to save coaching fields for coach users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_username text;
  user_email text;
  user_role text;
BEGIN
  -- Extract username, email, and role from metadata
  user_username := new.raw_user_meta_data->>'username';
  user_email := new.email;
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Enforce username as required
  IF COALESCE(user_username, '') = '' THEN
    RAISE EXCEPTION 'Username is required and must be provided during signup.';
  END IF;
  
  -- Validate username format (3-20 chars, alphanumeric and underscores only)
  IF NOT (user_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-20 characters and contain only letters, numbers, and underscores.';
  END IF;
  
  -- Check if username already exists (keep this check as usernames are managed by us)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = user_username) THEN
    RAISE EXCEPTION 'Username "%" is already taken. Please choose a different username.', user_username;
  END IF;

  -- Note: No email uniqueness check needed here - Supabase handles this at auth.users level

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
    has_completed_tutorial,
    coaching_focus,
    experience
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New User'),
    user_email,
    user_username,
    user_role,
    CASE 
      WHEN user_role = 'coach' 
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
    false,
    CASE 
      WHEN user_role = 'coach' 
      THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'coachingFocus', '[]'::jsonb)))
      ELSE NULL
    END,
    CASE 
      WHEN user_role = 'coach' 
      THEN new.raw_user_meta_data->>'experience'
      ELSE NULL
    END
  );
  RETURN new;
END;
$function$