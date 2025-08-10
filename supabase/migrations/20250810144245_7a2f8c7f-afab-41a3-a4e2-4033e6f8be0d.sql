-- 1) Ensure required extension exists for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Ensure table has RLS enabled (safe to run repeatedly)
ALTER TABLE public.shared_activity_unread ENABLE ROW LEVEL SECURITY;

-- 3) Add extra indexes for performance
CREATE INDEX IF NOT EXISTS idx_unread_recipient_read_created
  ON public.shared_activity_unread (recipient_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unread_created_at
  ON public.shared_activity_unread (created_at DESC);

-- 4) Block client-side inserts and deletes explicitly
DROP POLICY IF EXISTS "No client inserts" ON public.shared_activity_unread;
CREATE POLICY "No client inserts"
ON public.shared_activity_unread FOR INSERT
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes" ON public.shared_activity_unread;
CREATE POLICY "No client deletes"
ON public.shared_activity_unread FOR DELETE
USING (false);

-- 5) Grant execute permissions on the RPC functions to authenticated role
-- (Run these AFTER the functions are created.)
GRANT EXECUTE ON FUNCTION public.has_unread_any() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_unread_for_connection(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_unread_for_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_unread_for_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_unread_for_connection(uuid, uuid) TO authenticated;

-- 6) Enable Supabase Realtime for this table
ALTER TABLE public.shared_activity_unread REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'shared_activity_unread'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_activity_unread;
  END IF;
END
$$ LANGUAGE plpgsql;

-- 7) Schema verification comment (no changes required):
-- shared_sessions(session_id, player_id, coach_id) exists per schema
-- hand_feedback(hand_id, coach_id, student_id) exists per schema
-- session_hands_new(id, session_id) exists per schema