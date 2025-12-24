
-- Enhance the existing prevent_start_time_update function to be more robust
CREATE OR REPLACE FUNCTION prevent_start_time_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow start_time to be updated if it was previously NULL
  -- This allows initial setting but prevents any subsequent changes
  IF OLD.start_time IS NOT NULL AND NEW.start_time IS DISTINCT FROM OLD.start_time THEN
    RAISE EXCEPTION 'start_time cannot be updated once set. Original: %, Attempted: %', OLD.start_time, NEW.start_time;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS protect_start_time ON public.sessions;

-- Create the trigger to protect start_time from updates
CREATE TRIGGER protect_start_time
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION prevent_start_time_update();

-- Also protect session_tables start_time
DROP TRIGGER IF EXISTS protect_table_start_time ON public.session_tables;

CREATE TRIGGER protect_table_start_time
BEFORE UPDATE ON public.session_tables
FOR EACH ROW
EXECUTE FUNCTION prevent_start_time_update();
