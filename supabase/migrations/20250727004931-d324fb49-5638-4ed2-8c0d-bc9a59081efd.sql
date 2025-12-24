-- Add RLS policy to profiles table for connected users visibility
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_student_connections
    WHERE
      (coach_id = auth.uid() AND student_id = id)
      OR
      (student_id = auth.uid() AND coach_id = id)
  )
);

-- Add indexes for better performance on coach_student_connections
CREATE INDEX idx_coach_student_connections_coach_id ON public.coach_student_connections (coach_id);
CREATE INDEX idx_coach_student_connections_student_id ON public.coach_student_connections (student_id);