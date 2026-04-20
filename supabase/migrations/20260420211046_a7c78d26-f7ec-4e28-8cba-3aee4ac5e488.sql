-- Ensure RLS is enabled on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to receive realtime messages.
-- Per-row authorization for postgres_changes is enforced by RLS on the underlying
-- source tables (sessions, session_hands_new, player_goals, notifications, etc.),
-- which already restrict SELECT to the row owner / approved coach.
DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated users can receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);