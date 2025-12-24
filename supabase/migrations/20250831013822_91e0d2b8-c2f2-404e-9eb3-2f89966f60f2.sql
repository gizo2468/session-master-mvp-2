-- Add currency column to session_tables to track currency per table
ALTER TABLE session_tables 
ADD COLUMN currency text DEFAULT 'USD';

-- Update existing session_tables to inherit currency from their parent session
UPDATE session_tables 
SET currency = sessions.currency 
FROM sessions 
WHERE session_tables.session_id = sessions.id 
AND session_tables.currency IS NULL;

-- Create index on currency column for better performance
CREATE INDEX idx_session_tables_currency ON session_tables(currency);

-- Update the auto_populate_session_id function to also populate currency from session
CREATE OR REPLACE FUNCTION public.auto_populate_session_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.table_id IS NOT NULL AND NEW.session_id IS NULL THEN
    SELECT session_id INTO NEW.session_id 
    FROM session_tables 
    WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Add trigger to auto-populate currency when creating new tables
CREATE OR REPLACE FUNCTION public.auto_populate_table_currency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- If currency is not provided but session_id is, inherit from session
  IF NEW.currency IS NULL AND NEW.session_id IS NOT NULL THEN
    SELECT currency INTO NEW.currency 
    FROM sessions 
    WHERE id = NEW.session_id;
  END IF;
  
  -- Default to USD if still null
  IF NEW.currency IS NULL THEN
    NEW.currency := 'USD';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for auto-populating currency
DROP TRIGGER IF EXISTS trigger_auto_populate_table_currency ON session_tables;
CREATE TRIGGER trigger_auto_populate_table_currency
  BEFORE INSERT ON session_tables
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_table_currency();