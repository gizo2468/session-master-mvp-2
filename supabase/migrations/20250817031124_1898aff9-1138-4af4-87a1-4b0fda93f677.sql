-- Clean up session hands table structure and RLS policies

-- First, let's consolidate to use session_hands_new as the primary table
-- and clean up the RLS policies

-- Drop all existing policies on session_hands_new to start fresh
DROP POLICY IF EXISTS "Coaches can view hands from shared sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can create hands in their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can create their own session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can delete hands from their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can delete their own session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can delete their session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can insert their session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can update hands in their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can update their own session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can update their session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can view hands from their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can view their own session hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can view their session hands" ON session_hands_new;

-- Create clean, simplified RLS policies for session_hands_new
CREATE POLICY "Users can manage their own hands" 
ON session_hands_new 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view shared session hands" 
ON session_hands_new 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM shared_sessions ss
    JOIN sessions s ON s.id = ss.session_id
    WHERE s.id = session_hands_new.session_id 
    AND ss.coach_id = auth.uid()
  )
);

-- Add foreign key constraints for data integrity
ALTER TABLE session_hands_new 
ADD CONSTRAINT fk_session_hands_session_id 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

ALTER TABLE session_hands_new 
ADD CONSTRAINT fk_session_hands_table_id 
FOREIGN KEY (table_id) REFERENCES session_tables(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_hands_new_session_id ON session_hands_new(session_id);
CREATE INDEX IF NOT EXISTS idx_session_hands_new_table_id ON session_hands_new(table_id);
CREATE INDEX IF NOT EXISTS idx_session_hands_new_user_id ON session_hands_new(user_id);

-- Create trigger to auto-populate session_id from table_id
CREATE OR REPLACE FUNCTION auto_populate_session_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.table_id IS NOT NULL AND NEW.session_id IS NULL THEN
    SELECT session_id INTO NEW.session_id 
    FROM session_tables 
    WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_session_id
  BEFORE INSERT OR UPDATE ON session_hands_new
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_session_id();