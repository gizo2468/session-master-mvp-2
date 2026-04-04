
CREATE OR REPLACE FUNCTION public.get_student_header_identity(p_student_id uuid)
RETURNS TABLE(id uuid, full_name text, profile_picture text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Only allow if caller is an approved coach for this student
  IF NOT EXISTS (
    SELECT 1 FROM public.coach_student_connections
    WHERE coach_id = auth.uid()
      AND student_id = p_student_id
      AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT upd.id, upd.full_name, upd.profile_picture
  FROM public.user_private_data upd
  WHERE upd.id = p_student_id;
END;
$$;
