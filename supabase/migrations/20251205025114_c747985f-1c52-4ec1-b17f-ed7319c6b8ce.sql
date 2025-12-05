-- Add new columns for complete hand data persistence
ALTER TABLE session_hands_new
ADD COLUMN IF NOT EXISTS villains JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS small_blind NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS big_blind NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'NLH',
ADD COLUMN IF NOT EXISTS flop_actions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS turn_actions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS river_actions JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS result_value NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS result_unit TEXT DEFAULT 'BB';

-- Add comments for documentation
COMMENT ON COLUMN session_hands_new.villains IS 'JSON array of villain data: [{hand, position, bigBlind}]';
COMMENT ON COLUMN session_hands_new.flop_actions IS 'JSON array of structured flop actions';
COMMENT ON COLUMN session_hands_new.turn_actions IS 'JSON array of structured turn actions';
COMMENT ON COLUMN session_hands_new.river_actions IS 'JSON array of structured river actions';
COMMENT ON COLUMN session_hands_new.result_value IS 'Numeric hand result value';
COMMENT ON COLUMN session_hands_new.result_unit IS 'Unit for result: BB or Chips';