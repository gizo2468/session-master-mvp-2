-- First, create a separate table for highly sensitive user data
CREATE TABLE IF NOT EXISTS public.user_private_data (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text,
  full_name text,
  profile_picture text,
  phone_number text,
  address jsonb,
  date_of_birth date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the private data table
ALTER TABLE public.user_private_data ENABLE ROW LEVEL SECURITY;

-- Create policy for private data - only user can access their own data
CREATE POLICY "Users can only access their own private data"
ON public.user_private_data
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Migrate existing sensitive data to the private table
INSERT INTO public.user_private_data (id, email, full_name, profile_picture)
SELECT id, email, full_name, profile_picture
FROM public.profiles
WHERE email IS NOT NULL OR full_name IS NOT NULL OR profile_picture IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, user_private_data.email),
  full_name = COALESCE(EXCLUDED.full_name, user_private_data.full_name),
  profile_picture = COALESCE(EXCLUDED.profile_picture, user_private_data.profile_picture);

-- Remove sensitive fields from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS profile_picture;

-- Create a security definer function to get safe profile data for cross-user access
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  online_nickname text,
  role text,
  coach_tier text,
  bio text,
  coaching_focus text[],
  experience text,
  students_coached_count integer,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT 
    p.id,
    p.username,
    p.online_nickname,
    p.role,
    p.coach_tier,
    p.bio,
    p.coaching_focus,
    p.experience,
    p.students_coached_count,
    p.is_active
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_active = true;
$$;

-- Drop the existing cross-user access policies
DROP POLICY IF EXISTS "Coaches can view limited student profile data" ON public.profiles;
DROP POLICY IF EXISTS "Students can view limited coach profile data" ON public.profiles;

-- Create new restrictive policies for cross-user access
-- Coaches can only see safe profile data of their approved students
CREATE POLICY "Coaches can view safe student profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'student' 
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.coach_id = auth.uid() 
    AND c.student_id = profiles.id 
    AND c.status = 'approved'
  )
);

-- Students can only see safe profile data of their approved coaches  
CREATE POLICY "Students can view safe coach profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'coach'
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.student_id = auth.uid() 
    AND c.coach_id = profiles.id 
    AND c.status = 'approved'
  )
);

-- Create trigger to update private data timestamps
CREATE OR REPLACE FUNCTION public.update_private_data_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_private_data_updated_at
  BEFORE UPDATE ON public.user_private_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_private_data_updated_at();

-- Update the handle_new_user function to work with the new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  user_username text;
  user_email text;
  user_full_name text;
  user_role text;
BEGIN
  -- Extract data from metadata
  user_username := new.raw_user_meta_data->>'username';
  user_email := new.email;
  user_full_name := COALESCE(new.raw_user_meta_data->>'fullName', 'New User');
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Enforce username as required
  IF COALESCE(user_username, '') = '' THEN
    RAISE EXCEPTION 'Username is required and must be provided during signup.';
  END IF;
  
  -- Validate username format
  IF NOT (user_username ~ '^[a-zA-Z0-9_]{3,20}$') THEN
    RAISE EXCEPTION 'Invalid username format. Username must be 3-20 characters and contain only letters, numbers, and underscores.';
  END IF;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = user_username) THEN
    RAISE EXCEPTION 'Username "%" is already taken. Please choose a different username.', user_username;
  END IF;

  -- Insert into profiles table (non-sensitive data only)
  INSERT INTO public.profiles (
    id,
    username,
    role,
    coach_tier,
    language,
    notification_preferences,
    is_active,
    has_accepted_terms,
    coaching_focus,
    experience
  ) VALUES (
    new.id,
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

  -- Insert sensitive data into private table
  INSERT INTO public.user_private_data (
    id,
    email,
    full_name
  ) VALUES (
    new.id,
    user_email,
    user_full_name
  );

  RETURN new;
END;
$$;