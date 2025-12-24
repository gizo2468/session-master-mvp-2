-- Add color column to player_notes table for opponent color tagging
ALTER TABLE public.player_notes 
ADD COLUMN color text DEFAULT 'yellow';