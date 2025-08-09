-- Enable RLS (safe if already enabled)
ALTER TABLE public.coach_student_connections ENABLE ROW LEVEL SECURITY;

-- Prevent duplicates for active (pending/approved) connections
CREATE UNIQUE INDEX IF NOT EXISTS coach_student_unique_active
  ON public.coach_student_connections (coach_id, student_id)
  WHERE status IN ('pending', 'approved');

-- Drop existing policies to replace with stricter ones supporting both directions
DROP POLICY IF EXISTS "Coaches can update connection status" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Coaches can view their connections" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Students can create connection requests" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Students can view their connections" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON public.coach_student_connections;

-- INSERT policies
-- Players (students) can send requests to coaches
CREATE POLICY "Players can create connection requests"
ON public.coach_student_connections
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'::text
  AND auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p_coach
    WHERE p_coach.id = coach_id AND p_coach.role = 'coach'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p_student
    WHERE p_student.id = student_id AND p_student.role = 'student'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.coach_id = coach_id
      AND c.student_id = student_id
      AND c.status IN ('pending','approved')
  )
);

-- Coaches can send requests to players (students)
CREATE POLICY "Coaches can create connection requests"
ON public.coach_student_connections
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'::text
  AND auth.uid() = coach_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p_coach
    WHERE p_coach.id = coach_id AND p_coach.role = 'coach'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p_student
    WHERE p_student.id = student_id AND p_student.role = 'student'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.coach_id = coach_id
      AND c.student_id = student_id
      AND c.status IN ('pending','approved')
  )
);

-- SELECT policy: both coach and player can view the row
CREATE POLICY "Coach and Player can view connection"
ON public.coach_student_connections
FOR SELECT
TO authenticated
USING (
  auth.uid() = coach_id OR auth.uid() = student_id
);

-- UPDATE policies
-- Players (students) can approve or deny a pending request sent to them
CREATE POLICY "Players can respond to pending requests"
ON public.coach_student_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (
  auth.uid() = student_id
  AND status IN ('approved','rejected')
);

-- Coaches can cancel a pending request they sent
CREATE POLICY "Coaches can cancel pending requests they sent"
ON public.coach_student_connections
FOR UPDATE
TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (
  auth.uid() = coach_id
  AND status = 'cancelled'
);

-- DELETE policy: allow either side to delete their connection
CREATE POLICY "Coach or Player can delete connection"
ON public.coach_student_connections
FOR DELETE
TO authenticated
USING (
  auth.uid() = coach_id OR auth.uid() = student_id
);