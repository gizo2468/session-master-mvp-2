
CREATE TABLE public.session_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_time_utc bigint NOT NULL,
  planned_duration_seconds integer NOT NULL,
  end_time_utc bigint,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_breaks TO authenticated;
GRANT ALL ON public.session_breaks TO service_role;

ALTER TABLE public.session_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own breaks" ON public.session_breaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own breaks" ON public.session_breaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own breaks" ON public.session_breaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own breaks" ON public.session_breaks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX session_breaks_session_idx ON public.session_breaks(session_id, end_time_utc);
