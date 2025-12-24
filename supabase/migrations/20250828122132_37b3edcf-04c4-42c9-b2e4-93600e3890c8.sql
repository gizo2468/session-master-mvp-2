-- Fix all functions that don't have explicit search_path set
-- Update the get_current_user_id function to include explicit search_path
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT auth.uid();
$$;

-- Update any other functions that might be missing search_path
-- Check and fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the update_session_live_state_updated_at function
CREATE OR REPLACE FUNCTION public.update_session_live_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the update_ui_state_updated_at function
CREATE OR REPLACE FUNCTION public.update_ui_state_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the prevent_start_time_update function
CREATE OR REPLACE FUNCTION public.prevent_start_time_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Only allow start_time to be updated if it was previously NULL
  -- This allows initial setting but prevents any subsequent changes
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    RAISE EXCEPTION 'start_time cannot be updated once set. Original: %, Attempted: %', OLD.start_time, NEW.start_time;
  END IF;
  RETURN NEW;
END;
$$;

-- Update the prevent_start_time_corruption function
CREATE OR REPLACE FUNCTION public.prevent_start_time_corruption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Prevent start_time from being updated once set, except for initial creation
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    RAISE EXCEPTION 'start_time cannot be modified once set. Original: %, Attempted: %', OLD.start_time, NEW.start_time;
  END IF;
  
  -- Auto-populate start_time_utc if start_time is set but start_time_utc is null
  IF NEW.start_time IS NOT NULL AND NEW.start_time_utc IS NULL THEN
    NEW.start_time_utc = EXTRACT(epoch FROM NEW.start_time) * 1000;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the prevent_table_start_time_corruption function
CREATE OR REPLACE FUNCTION public.prevent_table_start_time_corruption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Prevent start_time from being updated once set
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    RAISE EXCEPTION 'table start_time cannot be modified once set. Original: %, Attempted: %', OLD.start_time, NEW.start_time;
  END IF;
  
  -- Auto-populate start_time_utc if start_time is set but start_time_utc is null
  IF NEW.start_time IS NOT NULL AND NEW.start_time_utc IS NULL THEN
    NEW.start_time_utc = EXTRACT(epoch FROM NEW.start_time) * 1000;
  END IF;
  
  -- Auto-populate end_time_utc if end_time is set but end_time_utc is null
  IF NEW.end_time IS NOT NULL AND NEW.end_time_utc IS NULL THEN
    NEW.end_time_utc = EXTRACT(epoch FROM NEW.end_time) * 1000;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the auto_populate_session_id function  
CREATE OR REPLACE FUNCTION public.auto_populate_session_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.table_id IS NOT NULL AND NEW.session_id IS NULL THEN
    SELECT session_id INTO NEW.session_id 
    FROM session_tables 
    WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$;