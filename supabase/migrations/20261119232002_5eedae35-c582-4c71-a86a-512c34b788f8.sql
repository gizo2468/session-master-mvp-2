ALTER FUNCTION public.training_note_student(uuid) SECURITY INVOKER;
CREATE INDEX IF NOT EXISTS training_note_replies_lesson_idx ON public.training_note_replies(lesson_id);