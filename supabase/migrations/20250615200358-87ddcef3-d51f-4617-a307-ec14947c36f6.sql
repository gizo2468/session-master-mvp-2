
-- Fix the timezone inconsistency by making end_time timezone-aware to match start_time
ALTER TABLE public.sessions 
ALTER COLUMN end_time TYPE timestamptz USING end_time AT TIME ZONE 'UTC';

-- Ensure session_tables also has consistent timezone handling
ALTER TABLE public.session_tables 
ALTER COLUMN end_time TYPE timestamptz USING end_time AT TIME ZONE 'UTC';
