-- Add RLS policy to allow coaches to view full_name and profile_picture of their approved students
CREATE POLICY "Coaches can view student names and pictures" 
ON public.user_private_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.coach_student_connections c 
    WHERE c.coach_id = auth.uid() 
      AND c.student_id = user_private_data.id 
      AND c.status = 'approved'
  )
);

-- Add RLS policy to allow students to view full_name and profile_picture of their approved coaches
CREATE POLICY "Students can view coach names and pictures" 
ON public.user_private_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.coach_student_connections c 
    WHERE c.student_id = auth.uid() 
      AND c.coach_id = user_private_data.id 
      AND c.status = 'approved'
  )
);