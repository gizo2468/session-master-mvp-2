
-- Fix the database schema and data issues causing the 3-hour timer bug

-- 1. Change start_time column to timestamp with time zone to prevent timezone interpretation issues
ALTER TABLE public.sessions 
ALTER COLUMN start_time TYPE timestamp with time zone 
USING start_time AT TIME ZONE 'UTC';

-- 2. Add start_time_utc column to store raw UTC timestamps
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS start_time_utc bigint;

-- 3. Populate start_time_utc with the equivalent UTC timestamp in milliseconds
UPDATE public.sessions 
SET start_time_utc = EXTRACT(epoch FROM start_time) * 1000
WHERE start_time_utc IS NULL;

-- 4. Reset incorrect session_duration values for active sessions to start fresh
UPDATE public.sessions 
SET session_duration = 0 
WHERE is_active = true;

-- 5. Create a trigger to prevent start_time corruption during updates
CREATE OR REPLACE FUNCTION public.prevent_start_time_corruption()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply the trigger to the sessions table
DROP TRIGGER IF EXISTS prevent_start_time_corruption_trigger ON public.sessions;
CREATE TRIGGER prevent_start_time_corruption_trigger
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_start_time_corruption();
