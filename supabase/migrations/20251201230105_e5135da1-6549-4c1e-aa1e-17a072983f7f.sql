-- Add opponent_profile_id column to session_hands_new table
ALTER TABLE session_hands_new 
ADD COLUMN opponent_profile_id uuid REFERENCES opponent_profiles(id) ON DELETE SET NULL;

-- Create index for efficient lookups of hands by opponent
CREATE INDEX idx_session_hands_opponent ON session_hands_new(opponent_profile_id) 
WHERE opponent_profile_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN session_hands_new.opponent_profile_id IS 'Links hand to an opponent profile from My Notes feature';