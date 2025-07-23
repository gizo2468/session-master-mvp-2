-- Add currency field to sessions table
ALTER TABLE public.sessions 
ADD COLUMN currency text DEFAULT 'USD';