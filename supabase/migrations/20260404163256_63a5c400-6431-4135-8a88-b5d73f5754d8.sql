DROP POLICY IF EXISTS "Coach can create goals for approved students" ON player_goals;

CREATE POLICY "Coach can create goals for approved students" ON player_goals
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.coach_id = auth.uid()
      AND c.student_id = player_goals.student_id
      AND c.status = 'approved'
  )
);