CREATE POLICY "No client access to hand secrets" ON public.training_hand_secrets FOR ALL TO authenticated USING (false) WITH CHECK (false);
DROP POLICY "Coach reads table state" ON public.training_table_state;
DROP POLICY "Participants read table state" ON public.training_table_state;
CREATE POLICY "Lesson members read table state" ON public.training_table_state FOR SELECT TO authenticated USING (public.is_lesson_coach(lesson_id) OR public.is_lesson_participant(lesson_id));