CREATE TABLE public.training_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  game_type text NOT NULL DEFAULT 'NLH',
  format text NOT NULL DEFAULT 'cash',
  max_seats integer NOT NULL DEFAULT 6,
  small_blind numeric NOT NULL DEFAULT 1,
  big_blind numeric NOT NULL DEFAULT 2,
  ante numeric NOT NULL DEFAULT 0,
  default_stack_bb numeric NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'draft',
  scenario_preset jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz,
  CONSTRAINT tl_game_type CHECK (game_type IN ('NLH','PLO')),
  CONSTRAINT tl_format CHECK (format IN ('cash','tournament')),
  CONSTRAINT tl_seats CHECK (max_seats BETWEEN 2 AND 9),
  CONSTRAINT tl_status CHECK (status IN ('draft','live','paused','ended'))
);
CREATE TABLE public.training_lesson_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  seat_type text NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  bot_name text,
  bot_style text,
  starting_stack numeric,
  current_stack numeric,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, seat_number),
  CONSTRAINT tlp_type CHECK (seat_type IN ('student','bot','coach','closed')),
  CONSTRAINT tlp_style CHECK (bot_style IS NULL OR bot_style IN ('tight_passive','tight_aggressive','loose_passive','loose_aggressive')),
  CONSTRAINT tlp_student CHECK ((seat_type = 'student') = (student_id IS NOT NULL))
);
CREATE TABLE public.training_hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  hand_number integer NOT NULL,
  dealer_seat integer,
  board_cards text,
  pot_total numeric NOT NULL DEFAULT 0,
  winners jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  scenario_preset jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  UNIQUE (lesson_id, hand_number)
);
CREATE TABLE public.training_hand_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id uuid NOT NULL REFERENCES public.training_hands(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  player_id uuid,
  street text NOT NULL,
  action text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  pot_after numeric,
  revealed_cards text,
  sequence integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tha_street CHECK (street IN ('preflop','flop','turn','river','showdown')),
  CONSTRAINT tha_action CHECK (action IN ('fold','check','call','bet','raise','all-in','post_blind','show'))
);
CREATE TABLE public.training_hand_private_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id uuid NOT NULL REFERENCES public.training_hands(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  player_id uuid,
  hole_cards text NOT NULL,
  UNIQUE (hand_id, seat_number)
);
CREATE TABLE public.training_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  hand_id uuid REFERENCES public.training_hands(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.training_hand_actions(id) ON DELETE CASCADE,
  student_id uuid,
  coach_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.training_lesson_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  summary_text text,
  stats jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_lessons, public.training_lesson_participants, public.training_hands, public.training_hand_actions, public.training_hand_private_cards, public.training_notes, public.training_lesson_summaries TO authenticated;
GRANT ALL ON public.training_lessons, public.training_lesson_participants, public.training_hands, public.training_hand_actions, public.training_hand_private_cards, public.training_notes, public.training_lesson_summaries TO service_role;

ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lesson_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_hand_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_hand_private_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lesson_summaries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_lesson_coach(p_lesson_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.training_lessons WHERE id = p_lesson_id AND coach_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.is_lesson_participant(p_lesson_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.training_lesson_participants WHERE lesson_id = p_lesson_id AND student_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION public.hand_lesson_id(p_hand_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT lesson_id FROM public.training_hands WHERE id = p_hand_id;
$$;
REVOKE EXECUTE ON FUNCTION public.is_lesson_coach(uuid), public.is_lesson_participant(uuid), public.hand_lesson_id(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_lesson_coach(uuid), public.is_lesson_participant(uuid), public.hand_lesson_id(uuid) TO authenticated;

CREATE POLICY "Coach manages own lessons" ON public.training_lessons FOR ALL TO authenticated USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE POLICY "Participants read lessons" ON public.training_lessons FOR SELECT TO authenticated USING (public.is_lesson_participant(id));

CREATE POLICY "Coach manages seats" ON public.training_lesson_participants FOR ALL TO authenticated USING (public.is_lesson_coach(lesson_id)) WITH CHECK (public.is_lesson_coach(lesson_id));
CREATE POLICY "Participants read seats" ON public.training_lesson_participants FOR SELECT TO authenticated USING (public.is_lesson_participant(lesson_id));

CREATE POLICY "Coach manages hands" ON public.training_hands FOR ALL TO authenticated USING (public.is_lesson_coach(lesson_id)) WITH CHECK (public.is_lesson_coach(lesson_id));
CREATE POLICY "Participants read hands" ON public.training_hands FOR SELECT TO authenticated USING (public.is_lesson_participant(lesson_id));

CREATE POLICY "Coach manages actions" ON public.training_hand_actions FOR ALL TO authenticated USING (public.is_lesson_coach(public.hand_lesson_id(hand_id))) WITH CHECK (public.is_lesson_coach(public.hand_lesson_id(hand_id)));
CREATE POLICY "Participants read actions" ON public.training_hand_actions FOR SELECT TO authenticated USING (public.is_lesson_participant(public.hand_lesson_id(hand_id)));

CREATE POLICY "Coach manages private cards" ON public.training_hand_private_cards FOR ALL TO authenticated USING (public.is_lesson_coach(public.hand_lesson_id(hand_id))) WITH CHECK (public.is_lesson_coach(public.hand_lesson_id(hand_id)));
CREATE POLICY "Player reads own cards" ON public.training_hand_private_cards FOR SELECT TO authenticated USING (player_id = auth.uid());

CREATE POLICY "Coach manages notes" ON public.training_notes FOR ALL TO authenticated USING (public.is_lesson_coach(lesson_id)) WITH CHECK (public.is_lesson_coach(lesson_id) AND coach_id = auth.uid());
CREATE POLICY "Student reads addressed notes" ON public.training_notes FOR SELECT TO authenticated USING (public.is_lesson_participant(lesson_id) AND (student_id IS NULL OR student_id = auth.uid()));

CREATE POLICY "Coach manages summaries" ON public.training_lesson_summaries FOR ALL TO authenticated USING (public.is_lesson_coach(lesson_id)) WITH CHECK (public.is_lesson_coach(lesson_id));
CREATE POLICY "Student reads own published summary" ON public.training_lesson_summaries FOR SELECT TO authenticated USING (student_id = auth.uid() AND published = true);

CREATE OR REPLACE FUNCTION public.validate_training_seat() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lesson public.training_lessons; v_tier text; v_limit int; v_count int;
BEGIN
  SELECT * INTO v_lesson FROM public.training_lessons WHERE id = NEW.lesson_id;
  IF NEW.seat_number < 1 OR NEW.seat_number > v_lesson.max_seats THEN
    RAISE EXCEPTION 'Seat number out of range';
  END IF;
  IF NEW.seat_type = 'student' THEN
    IF NOT public.is_coach_for_student(v_lesson.coach_id, NEW.student_id) THEN
      RAISE EXCEPTION 'Student is not an approved student of this coach';
    END IF;
    SELECT coach_tier INTO v_tier FROM public.profiles WHERE id = v_lesson.coach_id;
    v_limit := CASE v_tier WHEN 'starter' THEN 10 WHEN 'pro' THEN 15 WHEN 'elite' THEN 25 ELSE 0 END;
    SELECT count(*) INTO v_count FROM public.training_lesson_participants
      WHERE lesson_id = NEW.lesson_id AND seat_type = 'student' AND id <> NEW.id;
    IF v_count + 1 > v_limit THEN
      RAISE EXCEPTION 'Student limit for your coach plan reached';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_training_seat BEFORE INSERT OR UPDATE ON public.training_lesson_participants
FOR EACH ROW EXECUTE FUNCTION public.validate_training_seat();

CREATE TRIGGER training_lessons_updated_at BEFORE UPDATE ON public.training_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER training_summaries_updated_at BEFORE UPDATE ON public.training_lesson_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();