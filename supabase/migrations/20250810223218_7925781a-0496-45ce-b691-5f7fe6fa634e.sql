-- Add image_url column to player_goals if it does not exist
ALTER TABLE public.player_goals
ADD COLUMN IF NOT EXISTS image_url text;