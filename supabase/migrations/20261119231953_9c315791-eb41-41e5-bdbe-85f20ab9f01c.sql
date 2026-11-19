ALTER TABLE public.training_notes ADD COLUMN IF NOT EXISTS flag text;
CREATE OR REPLACE FUNCTION public.validate_training_note_flag() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.flag IS NOT NULL AND NEW.flag NOT IN ('mistake','good_play') THEN RAISE EXCEPTION 'Invalid flag'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS training_notes_flag_check ON public.training_notes;
CREATE TRIGGER training_notes_flag_check BEFORE INSERT OR UPDATE ON public.training_notes FOR EACH ROW EXECUTE FUNCTION public.validate_training_note_flag();

ALTER TABLE public.training_lesson_summaries
  ADD COLUMN IF NOT EXISTS key_hand_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE TABLE public.training_note_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.training_notes(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.training_note_replies TO authenticated;
GRANT ALL ON public.training_note_replies TO service_role;
ALTER TABLE public.training_note_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX training_note_replies_note_idx ON public.training_note_replies(note_id);

CREATE OR REPLACE FUNCTION public.training_note_student(p_note_id uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT student_id FROM public.training_notes WHERE id = p_note_id $$;
REVOKE EXECUTE ON FUNCTION public.training_note_student(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.training_note_student(uuid) TO authenticated;

CREATE POLICY "Coach and note student read replies" ON public.training_note_replies FOR SELECT TO authenticated
  USING (is_lesson_coach(lesson_id) OR training_note_student(note_id) = auth.uid());
CREATE POLICY "Coach and note student write replies" ON public.training_note_replies FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (is_lesson_coach(lesson_id) OR training_note_student(note_id) = auth.uid()));
CREATE POLICY "Authors delete own replies" ON public.training_note_replies FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Keep lesson_id in sync with the note (prevents cross-lesson spoofing).
CREATE OR REPLACE FUNCTION public.set_training_reply_lesson() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT lesson_id INTO NEW.lesson_id FROM public.training_notes WHERE id = NEW.note_id;
  IF NEW.lesson_id IS NULL THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF length(trim(NEW.body)) = 0 OR length(NEW.body) > 2000 THEN RAISE EXCEPTION 'Invalid reply'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER training_reply_lesson BEFORE INSERT ON public.training_note_replies FOR EACH ROW EXECUTE FUNCTION public.set_training_reply_lesson();

CREATE OR REPLACE FUNCTION public.notify_training_reply() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coach uuid; v_student uuid; v_title text; v_recipient uuid;
BEGIN
  SELECT l.coach_id, l.title, n.student_id INTO v_coach, v_title, v_student
    FROM public.training_notes n JOIN public.training_lessons l ON l.id = n.lesson_id WHERE n.id = NEW.note_id;
  v_recipient := CASE WHEN NEW.author_id = v_coach THEN v_student ELSE v_coach END;
  IF v_recipient IS NULL OR v_recipient = NEW.author_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (recipient_user_id, sender_user_id, type, title, body, training_lesson_id)
  VALUES (v_recipient, NEW.author_id, 'training_note_reply',
    CASE WHEN NEW.author_id = v_coach THEN 'Coach replied to your question' ELSE 'Student replied to a note' END,
    v_title || ': ' || left(NEW.body, 120), NEW.lesson_id);
  RETURN NEW;
END $$;
CREATE TRIGGER training_reply_notify AFTER INSERT ON public.training_note_replies FOR EACH ROW EXECUTE FUNCTION public.notify_training_reply();

CREATE OR REPLACE FUNCTION public.notify_training_summary() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coach uuid; v_title text;
BEGIN
  IF NOT NEW.published THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.published AND OLD.published_at IS NOT DISTINCT FROM NEW.published_at THEN RETURN NEW; END IF;
  SELECT coach_id, title INTO v_coach, v_title FROM public.training_lessons WHERE id = NEW.lesson_id;
  INSERT INTO public.notifications (recipient_user_id, sender_user_id, type, title, body, training_lesson_id)
  VALUES (NEW.student_id, v_coach, 'training_summary', 'A new lesson summary is available', v_title, NEW.lesson_id);
  RETURN NEW;
END $$;
CREATE TRIGGER training_summary_notify AFTER INSERT OR UPDATE ON public.training_lesson_summaries FOR EACH ROW EXECUTE FUNCTION public.notify_training_summary();

REVOKE EXECUTE ON FUNCTION public.notify_training_summary() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_training_reply() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_training_reply_lesson() FROM anon, public, authenticated;