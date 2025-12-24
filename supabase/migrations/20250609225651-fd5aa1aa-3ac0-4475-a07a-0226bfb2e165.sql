
-- Update the function to handle new user signup with comprehensive defaults
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
