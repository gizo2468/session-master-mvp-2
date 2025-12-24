-- Add tournament_type field to session_tables for individual table tournament type storage
ALTER TABLE public.session_tables 
ADD COLUMN tournament_type text;

-- Add comment for documentation
COMMENT ON COLUMN public.session_tables.tournament_type IS 'Single tournament type for this specific table (e.g., Freezeout, Bounty, PKO)';