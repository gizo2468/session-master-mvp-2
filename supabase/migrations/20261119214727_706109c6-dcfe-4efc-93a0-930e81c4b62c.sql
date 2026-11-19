CREATE TABLE public.training_table_state (
  lesson_id uuid PRIMARY KEY REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.training_table_state TO authenticated;
GRANT ALL ON public.training_table_state TO service_role;
ALTER TABLE public.training_table_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach reads table state" ON public.training_table_state FOR SELECT TO authenticated USING (public.is_lesson_coach(lesson_id));
CREATE POLICY "Participants read table state" ON public.training_table_state FOR SELECT TO authenticated USING (public.is_lesson_participant(lesson_id));

CREATE TABLE public.training_hand_secrets (
  hand_id uuid PRIMARY KEY REFERENCES public.training_hands(id) ON DELETE CASCADE,
  deck text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.training_hand_secrets TO service_role;
ALTER TABLE public.training_hand_secrets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS training_lesson_id uuid REFERENCES public.training_lessons(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_training_lesson ON public.notifications(training_lesson_id);

ALTER TABLE public.training_table_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_table_state;