-- Add column for multiple opponent profiles (array stored as JSONB)
ALTER TABLE public.session_hands_new 
ADD COLUMN IF NOT EXISTS opponent_profile_ids jsonb DEFAULT '[]'::jsonb;

-- Migrate existing single opponent_profile_id data to the new array column
UPDATE public.session_hands_new 
SET opponent_profile_ids = jsonb_build_array(opponent_profile_id)
WHERE opponent_profile_id IS NOT NULL 
  AND (opponent_profile_ids IS NULL OR opponent_profile_ids = '[]'::jsonb);

-- Add comment for documentation
COMMENT ON COLUMN public.session_hands_new.opponent_profile_ids IS 'Array of opponent profile IDs linked to this hand (for multi-way hands)';