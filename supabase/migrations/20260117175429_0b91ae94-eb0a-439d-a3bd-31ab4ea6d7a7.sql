-- Allow students to update seen_at on their feedback entries (for heart like toggle)
CREATE POLICY "Students can update seen_at on their feedback"
ON hand_feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);