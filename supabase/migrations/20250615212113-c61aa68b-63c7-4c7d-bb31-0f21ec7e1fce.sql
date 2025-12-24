
-- Step 1: Remove all existing RLS policies on session_hands_new to eliminate conflicts
DROP POLICY IF EXISTS "Users can view their own hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can create their own hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can update their own hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can delete their own hands" ON session_hands_new;
DROP POLICY IF EXISTS "Users can view hands from their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can create hands in their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can update hands in their sessions" ON session_hands_new;
DROP POLICY IF EXISTS "Users can delete hands from their sessions" ON session_hands_new;

-- Step 2: Create clean, consistent RLS policies using session ownership
CREATE POLICY "Users can view hands from their sessions" ON session_hands_new
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id)
  );

CREATE POLICY "Users can create hands in their sessions" ON session_hands_new
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id)
  );

CREATE POLICY "Users can update hands in their sessions" ON session_hands_new
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id)
  );

CREATE POLICY "Users can delete hands from their sessions" ON session_hands_new
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM sessions WHERE id = session_id)
  );
