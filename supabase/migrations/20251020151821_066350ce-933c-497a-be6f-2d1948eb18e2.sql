-- tighten policies to authenticated only and keep explicit anon deny

-- PROFILES: scope SELECT policies to authenticated role
DROP POLICY IF EXISTS "Coaches can view safe student profile data" ON public.profiles;
CREATE POLICY "Coaches can view safe student profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'student'::text
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.coach_id = auth.uid()
      AND c.student_id = profiles.id
      AND c.status = 'approved'
  )
);

DROP POLICY IF EXISTS "Students can view safe coach profile data" ON public.profiles;
CREATE POLICY "Students can view safe coach profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'coach'::text
  AND EXISTS (
    SELECT 1 FROM coach_student_connections c
    WHERE c.student_id = auth.uid()
      AND c.coach_id = profiles.id
      AND c.status = 'approved'
  )
);

-- USER_PRIVATE_DATA: scope self-access policy to authenticated role
DROP POLICY IF EXISTS "Users can only access their own private data" ON public.user_private_data;
CREATE POLICY "Users can only access their own private data"
ON public.user_private_data
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
