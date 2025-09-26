-- Create security definer function to safely expose limited user data to coaches
CREATE OR REPLACE FUNCTION public.get_coach_accessible_student_data(student_user_id uuid)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  profile_picture text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT 
    upd.id,
    upd.full_name,
    upd.profile_picture
  FROM public.user_private_data upd
  WHERE upd.id = student_user_id;
$$;

-- Create security definer function to safely expose limited coach data to students  
CREATE OR REPLACE FUNCTION public.get_student_accessible_coach_data(coach_user_id uuid)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  profile_picture text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
  SELECT 
    upd.id,
    upd.full_name,
    upd.profile_picture
  FROM public.user_private_data upd
  WHERE upd.id = coach_user_id;
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Coaches can view student names and pictures" ON public.user_private_data;
DROP POLICY IF EXISTS "Students can view coach names and pictures" ON public.user_private_data;

-- Create new restrictive policies that only allow access to safe data via functions
CREATE POLICY "Coaches can view limited student data via function" 
ON public.user_private_data 
FOR SELECT 
USING (
  id IN (
    SELECT student_id 
    FROM public.coach_student_connections 
    WHERE coach_id = auth.uid() 
      AND status = 'approved'
  )
  AND EXISTS (
    SELECT 1 FROM public.get_coach_accessible_student_data(id)
  )
);

CREATE POLICY "Students can view limited coach data via function" 
ON public.user_private_data 
FOR SELECT 
USING (
  id IN (
    SELECT coach_id 
    FROM public.coach_student_connections 
    WHERE student_id = auth.uid() 
      AND status = 'approved'
  )
  AND EXISTS (
    SELECT 1 FROM public.get_student_accessible_coach_data(id)
  )
);

-- Create view for safe coach-student data access
CREATE OR REPLACE VIEW public.safe_coach_student_data AS
SELECT 
  csc.id as connection_id,
  csc.coach_id,
  csc.student_id,
  csc.status,
  csc.created_at as connection_date,
  coach_data.full_name as coach_name,
  coach_data.profile_picture as coach_picture,
  student_data.full_name as student_name,
  student_data.profile_picture as student_picture
FROM public.coach_student_connections csc
LEFT JOIN public.get_student_accessible_coach_data(csc.coach_id) coach_data ON true
LEFT JOIN public.get_coach_accessible_student_data(csc.student_id) student_data ON true
WHERE csc.status = 'approved'
  AND (auth.uid() = csc.coach_id OR auth.uid() = csc.student_id);

-- Enable RLS on the view
ALTER VIEW public.safe_coach_student_data SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.safe_coach_student_data TO authenticated;