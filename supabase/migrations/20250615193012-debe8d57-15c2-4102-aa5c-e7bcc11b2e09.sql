
-- Fix the session_tables schema to match the sessions table structure
-- Add missing columns and ensure proper constraints

-- 1. Add start_time_utc column to session_tables
ALTER TABLE public.session_tables 
ADD COLUMN IF NOT EXISTS start_time_utc bigint;

-- 2. Add end_time_utc column to session_tables  
ALTER TABLE public.session_tables 
ADD COLUMN IF NOT EXISTS end_time_utc bigint;

-- 3. Populate start_time_utc for existing tables
UPDATE public.session_tables 
SET start_time_utc = EXTRACT(epoch FROM start_time) * 1000
WHERE start_time_utc IS NULL AND start_time IS NOT NULL;

-- 4. Populate end_time_utc for existing tables with end_time
UPDATE public.session_tables 
SET end_time_utc = EXTRACT(epoch FROM end_time) * 1000
WHERE end_time_utc IS NULL AND end_time IS NOT NULL;

-- 5. Ensure user_id is properly set for any orphaned tables
UPDATE public.session_tables 
SET user_id = (
  SELECT user_id 
  FROM public.sessions 
  WHERE sessions.id = session_tables.session_id
)
WHERE user_id IS NULL;

-- 6. Create trigger to prevent start_time corruption for tables
CREATE OR REPLACE FUNCTION public.prevent_table_start_time_corruption()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply the trigger to the session_tables table
DROP TRIGGER IF EXISTS prevent_table_start_time_corruption_trigger ON public.session_tables;
CREATE TRIGGER prevent_table_start_time_corruption_trigger
  BEFORE UPDATE ON public.session_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_table_start_time_corruption();
