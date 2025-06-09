
-- Create or replace the function to handle new user signup
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
    language,
    notification_preferences,
    is_active,
    has_accepted_terms
  ) VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'fullName', 'New User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    COALESCE(
      new.raw_user_meta_data->'notificationPreferences', 
      '{"newFeedback": true, "liveSessionStart": true}'::jsonb
    ),
    true,
    COALESCE((new.raw_user_meta_data->>'hasAcceptedTerms')::boolean, false)
  );
  RETURN new;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
