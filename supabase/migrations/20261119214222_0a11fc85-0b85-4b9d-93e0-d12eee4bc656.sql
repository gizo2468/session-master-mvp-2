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
    -- Free tier = 5 while Training Lab is temporarily free for all (set back to 0 to re-lock)
    v_limit := CASE v_tier WHEN 'starter' THEN 10 WHEN 'pro' THEN 15 WHEN 'elite' THEN 25 ELSE 5 END;
    SELECT count(*) INTO v_count FROM public.training_lesson_participants
      WHERE lesson_id = NEW.lesson_id AND seat_type = 'student' AND id <> NEW.id;
    IF v_count + 1 > v_limit THEN
      RAISE EXCEPTION 'Student limit for your coach plan reached';
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_training_seat() FROM anon, authenticated, public;