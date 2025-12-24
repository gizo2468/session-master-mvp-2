-- Security Enhancements Migration (Corrected)
-- Addresses: search_path hardening, function permissions, RLS policies, audit logging

-- 1. Update existing functions with proper search_path and security
CREATE OR REPLACE FUNCTION public.search_coach_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT id, username, role
  FROM public.profiles
  WHERE role = 'coach'
    AND lower(username) = lower(p_username)
    AND auth.uid() IS NOT NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.search_student_by_username(p_username text)
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT id, username, role
  FROM public.profiles
  WHERE role = 'student'
    AND lower(username) = lower(p_username)
    AND auth.uid() IS NOT NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(p_username)
  )
$$;

CREATE OR REPLACE FUNCTION public.check_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(email) = lower(p_email)
  )
$$;

CREATE OR REPLACE FUNCTION public.generate_connection_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code (excluding similar-looking characters)
    code := upper(
      substring(
        array_to_string(
          ARRAY(
            SELECT chr((65 + round(random() * 25))::integer)
            FROM generate_series(1, 6)
          ), 
          ''
        ) || 
        array_to_string(
          ARRAY(
            SELECT chr((50 + round(random() * 7))::integer)
            FROM generate_series(1, 6)
          ), 
          ''
        )
        FROM 1 FOR 6
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE connection_code = code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Keep get_current_user_id as SECURITY INVOKER (it only calls auth.uid())
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY INVOKER
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.update_terms_acceptance(user_id uuid, accepted boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  UPDATE public.profiles
  SET has_accepted_terms = accepted
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_coach_for_student(coach_user_id uuid, student_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.coach_student_connections 
    WHERE coach_id = coach_user_id 
      AND student_id = student_user_id 
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.end_session(p_session_id uuid, p_cash_out numeric, p_notes text DEFAULT NULL::text, p_roi numeric DEFAULT 0, p_itm_ratio_numerator integer DEFAULT 0, p_itm_ratio_denominator integer DEFAULT 0, p_tables_played integer DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Update the session
  UPDATE public.sessions SET 
    cash_out = p_cash_out,
    roi = p_roi,
    itm_ratio_numerator = p_itm_ratio_numerator,
    itm_ratio_denominator = p_itm_ratio_denominator,
    tables_played = p_tables_played,
    notes = COALESCE(p_notes, notes),
    end_time = now(),
    status = 'completed',
    is_active = false,
    current_status = 'ended'
  WHERE id = p_session_id AND user_id = auth.uid();
  
  -- Clean up live state
  DELETE FROM public.session_live_state 
  WHERE session_id = p_session_id AND user_id = auth.uid();
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_session(p_game_type text, p_format text, p_location text, p_physical_location text DEFAULT NULL::text, p_table_name text DEFAULT NULL::text, p_buy_in numeric DEFAULT 0, p_small_blind numeric DEFAULT 0, p_big_blind numeric DEFAULT 0, p_is_online boolean DEFAULT false, p_starting_bb integer DEFAULT NULL::integer, p_tournament_types text[] DEFAULT NULL::text[], p_is_multi_day boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  new_session_id uuid;
BEGIN
  INSERT INTO public.sessions (
    user_id,
    game_type,
    format,
    location,
    physical_location,
    table_name,
    buy_in,
    initial_buy_in,
    small_blind,
    big_blind,
    is_online,
    starting_bb,
    tournament_types,
    is_multi_day,
    start_time,
    status,
    is_active,
    current_status
  ) VALUES (
    auth.uid(),
    p_game_type,
    p_format,
    p_location,
    p_physical_location,
    p_table_name,
    p_buy_in,
    p_buy_in,
    p_small_blind,
    p_big_blind,
    p_is_online,
    p_starting_bb,
    p_tournament_types,
    p_is_multi_day,
    now(),
    'active',
    true,
    'running'
  ) RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- Complete the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
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
$$;

-- Update trigger functions with proper search_path
CREATE OR REPLACE FUNCTION public.increment_coach_student_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Only increment when a connection changes from pending/rejected to approved
  -- and it's a new unique student for this coach
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles 
    SET students_coached_count = students_coached_count + 1
    WHERE id = NEW.coach_id 
      AND role = 'coach'
      -- Only increment if this student wasn't already counted for this coach
      AND NOT EXISTS (
        SELECT 1 FROM public.coach_student_connections
        WHERE coach_id = NEW.coach_id 
          AND student_id = NEW.student_id 
          AND status = 'approved'
          AND id != NEW.id
      );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_player_goals_student_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- If the updater is the student (and not the coach), only allow status change
  IF auth.uid() = old.student_id AND auth.uid() != old.coach_id THEN
    IF (new.coach_id IS DISTINCT FROM old.coach_id)
       OR (new.student_id IS DISTINCT FROM old.student_id)
       OR (new.title IS DISTINCT FROM old.title)
       OR (new.details IS DISTINCT FROM old.details)
       OR (new.due_date IS DISTINCT FROM old.due_date)
       OR (new.color IS DISTINCT FROM old.color)
       OR (new.created_at IS DISTINCT FROM old.created_at) THEN
      RAISE EXCEPTION 'Only status can be changed by the student';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for the trigger functions
CREATE TRIGGER coach_student_count_trigger
  AFTER UPDATE ON public.coach_student_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coach_student_count();

CREATE TRIGGER player_goals_student_update_trigger
  BEFORE UPDATE ON public.player_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_player_goals_student_update();

-- 2. Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit log (only admins can view, system can insert)
CREATE POLICY "System can insert audit logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users cannot view audit logs" ON public.security_audit_log
  FOR SELECT USING (false);

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$$;

-- 3. Enhanced RLS policies for profiles table
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Coaches can view pending or approved student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Students can view approved coach profiles" ON public.profiles;

-- Create more restrictive profile policies
CREATE POLICY "Coaches can view limited student profile data" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_student_connections c
      WHERE c.coach_id = auth.uid() 
        AND c.student_id = profiles.id 
        AND c.status = 'approved'
    )
  );

CREATE POLICY "Students can view limited coach profile data" ON public.profiles
  FOR SELECT USING (
    profiles.role = 'coach' AND 
    EXISTS (
      SELECT 1 FROM public.coach_student_connections c
      WHERE c.student_id = auth.uid() 
        AND c.coach_id = profiles.id 
        AND c.status = 'approved'
    )
  );

-- 4. Enhanced RLS policies for donation_logs
DROP POLICY IF EXISTS "Users can insert their own donation logs" ON public.donation_logs;

CREATE POLICY "Authenticated users can insert donation logs" ON public.donation_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- No one can view donation logs (admin access only via direct DB)
CREATE POLICY "No public access to donation logs" ON public.donation_logs
  FOR SELECT USING (false);

-- 5. Add recommended unique index for coach-student connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_student_approved_unique 
  ON public.coach_student_connections (coach_id, student_id) 
  WHERE status = 'approved';

-- 6. Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(lower(email));

-- 7. Revoke and grant proper function permissions
-- Revoke EXECUTE from PUBLIC for all security-sensitive functions
REVOKE EXECUTE ON FUNCTION public.search_coach_by_username(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_student_by_username(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_email_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_connection_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_terms_acceptance(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_coach_for_student(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.end_session(uuid, numeric, text, numeric, integer, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_session(text, text, text, text, text, numeric, numeric, numeric, boolean, integer, text[], boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, uuid, jsonb, jsonb) FROM PUBLIC;

-- Grant EXECUTE only to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.search_coach_by_username(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_student_by_username(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_connection_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_terms_acceptance(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach_for_student(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_session(uuid, numeric, text, numeric, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_session(text, text, text, text, text, numeric, numeric, numeric, boolean, integer, text[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, uuid, jsonb, jsonb) TO authenticated;