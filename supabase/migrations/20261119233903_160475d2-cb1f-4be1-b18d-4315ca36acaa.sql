CREATE TABLE public.training_range_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  name text NOT NULL,
  ranges jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_range_templates TO authenticated;
GRANT ALL ON public.training_range_templates TO service_role;
ALTER TABLE public.training_range_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach manages own range templates" ON public.training_range_templates FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE TRIGGER trg_range_templates_updated BEFORE UPDATE ON public.training_range_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.training_bot_configs (
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  mode text NOT NULL DEFAULT 'style',
  ranges jsonb,
  template_id uuid REFERENCES public.training_range_templates(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id, seat_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_bot_configs TO authenticated;
GRANT ALL ON public.training_bot_configs TO service_role;
ALTER TABLE public.training_bot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lesson coach manages bot configs" ON public.training_bot_configs FOR ALL TO authenticated
  USING (public.is_lesson_coach(lesson_id)) WITH CHECK (public.is_lesson_coach(lesson_id));
CREATE OR REPLACE FUNCTION public.validate_bot_config_mode() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.mode NOT IN ('style','ranges','gto') THEN RAISE EXCEPTION 'invalid bot mode'; END IF;
  NEW.updated_at = now();
  RETURN NEW;
END $$;
CREATE TRIGGER trg_bot_config_validate BEFORE INSERT OR UPDATE ON public.training_bot_configs FOR EACH ROW EXECUTE FUNCTION public.validate_bot_config_mode();

ALTER TABLE public.training_lesson_summaries ADD COLUMN IF NOT EXISTS reveal_bot_ranges boolean NOT NULL DEFAULT false;
ALTER TABLE public.training_hands ADD COLUMN IF NOT EXISTS starting_stacks jsonb;

CREATE TABLE public.training_bot_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  hand_id uuid NOT NULL REFERENCES public.training_hands(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  sequence integer NOT NULL,
  meta jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bot_decisions_hand ON public.training_bot_decisions(hand_id);
GRANT SELECT ON public.training_bot_decisions TO authenticated;
GRANT ALL ON public.training_bot_decisions TO service_role;
ALTER TABLE public.training_bot_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coach or revealed student reads bot decisions" ON public.training_bot_decisions FOR SELECT TO authenticated
  USING (public.is_lesson_coach(lesson_id) OR EXISTS (
    SELECT 1 FROM public.training_lesson_summaries s
    WHERE s.lesson_id = training_bot_decisions.lesson_id AND s.student_id = auth.uid() AND s.published AND s.reveal_bot_ranges));