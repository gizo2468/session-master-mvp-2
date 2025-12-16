-- Add preflop_actions column to session_hands_new table
ALTER TABLE public.session_hands_new 
ADD COLUMN IF NOT EXISTS preflop_actions jsonb DEFAULT NULL;