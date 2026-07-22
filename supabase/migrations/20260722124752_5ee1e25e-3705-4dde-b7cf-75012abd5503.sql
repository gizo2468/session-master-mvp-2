
-- 1. Drop overly permissive profile read policy
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner" ON public.profiles;

-- 2. Fix chart_collections / chart_solutions: prevent modification of shared default rows
DROP POLICY IF EXISTS "chart_collections_owner" ON public.chart_collections;
DROP POLICY IF EXISTS "chart_solutions_owner" ON public.chart_solutions;

-- Ensure read access to shared defaults + owner rows
CREATE POLICY "Users can read own collections" ON public.chart_collections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read own solutions" ON public.chart_solutions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Restrict notifications INSERT: only self-notifications or between connected coach/student
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND (
      recipient_user_id = auth.uid()
      OR public.connection_exists(sender_user_id, recipient_user_id)
      OR public.connection_exists(recipient_user_id, sender_user_id)
    )
  );

-- 4. Restrict realtime.messages: drop overly broad policy
DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;

-- 5. Fix mutable search_path on send_push_for_notification
ALTER FUNCTION public.send_push_for_notification() SET search_path = public, pg_temp;

-- 6. Revoke EXECUTE from anon on all public SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, PUBLIC', r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', r.proname, r.args);
  END LOOP;
END $$;

-- 7. Tighten avatars bucket: remove broad listing SELECT policy (files are still accessible via public URL directly)
DROP POLICY IF EXISTS "Authenticated users can read avatars" ON storage.objects;
