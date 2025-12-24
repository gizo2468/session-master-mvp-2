-- Fix RLS policies for coach_student_connections to restore Player ↔ Coach connection functionality

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Coaches can create connection requests" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Players can create connection requests" ON public.coach_student_connections;

-- Create simplified and corrected INSERT policies that work properly
-- Allow coaches to create connection requests to students
CREATE POLICY "Coaches can create connection requests" 
ON public.coach_student_connections 
FOR INSERT 
WITH CHECK (
  status = 'pending' 
  AND auth.uid() = coach_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = coach_id AND role = 'coach'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = student_id AND role = 'student'
  )
  -- Prevent duplicate connections (fixed the self-referencing bug)
  AND NOT EXISTS (
    SELECT 1 FROM public.coach_student_connections existing
    WHERE existing.coach_id = coach_student_connections.coach_id 
      AND existing.student_id = coach_student_connections.student_id 
      AND existing.status IN ('pending', 'approved')
  )
);

-- Allow students to create connection requests to coaches
CREATE POLICY "Students can create connection requests" 
ON public.coach_student_connections 
FOR INSERT 
WITH CHECK (
  status = 'pending' 
  AND auth.uid() = student_id 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = coach_id AND role = 'coach'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = student_id AND role = 'student'
  )
  -- Prevent duplicate connections (fixed the self-referencing bug)
  AND NOT EXISTS (
    SELECT 1 FROM public.coach_student_connections existing
    WHERE existing.coach_id = coach_student_connections.coach_id 
      AND existing.student_id = coach_student_connections.student_id 
      AND existing.status IN ('pending', 'approved')
  )
);

-- Also fix the UPDATE policies to be more permissive for responses
DROP POLICY IF EXISTS "Coaches can cancel pending requests they sent" ON public.coach_student_connections;
DROP POLICY IF EXISTS "Players can respond to pending requests" ON public.coach_student_connections;

-- Allow coaches to update (cancel) their own requests or approve/reject incoming requests
CREATE POLICY "Coaches can update connection requests" 
ON public.coach_student_connections 
FOR UPDATE 
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- Allow students to update (approve/reject) requests sent to them or cancel their own requests
CREATE POLICY "Students can update connection requests" 
ON public.coach_student_connections 
FOR UPDATE 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);