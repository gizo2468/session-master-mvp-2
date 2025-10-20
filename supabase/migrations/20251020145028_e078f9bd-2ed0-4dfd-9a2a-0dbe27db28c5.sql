-- Fix PUBLIC_USER_DATA and PUBLIC_FEEDBACK_DATA security vulnerabilities
-- This migration locks down security definer functions and views that expose data to unauthenticated users

-- 1. Replace get_safe_profile_data with proper authorization checks
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  online_nickname text,
  role text,
  coach_tier text,
  bio text,
  coaching_focus text[],
  experience text,
  students_coached_count integer,
  is_active boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Only allow access if caller is the profile owner OR has an approved coach-student connection
  IF auth.uid() != profile_user_id 
     AND NOT EXISTS (
       SELECT 1 FROM public.coach_student_connections
       WHERE status = 'approved'
         AND (
           (coach_id = auth.uid() AND student_id = profile_user_id)
           OR (student_id = auth.uid() AND coach_id = profile_user_id)
         )
     ) THEN
    RAISE EXCEPTION 'Not authorized to view this profile';
  END IF;

  -- Return profile data only if authorized
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.online_nickname,
    p.role,
    p.coach_tier,
    p.bio,
    p.coaching_focus,
    p.experience,
    p.students_coached_count,
    p.is_active
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND p.is_active = true;
END;
$function$;

-- Revoke public/anon access, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) TO authenticated;

-- 2. Lock down search functions - require authentication
REVOKE EXECUTE ON FUNCTION public.search_coach_by_username(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_coach_by_username(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_coach_by_username(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.search_student_by_username(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_student_by_username(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_student_by_username(text) TO authenticated;

-- 3. Prevent email enumeration - require authentication
REVOKE EXECUTE ON FUNCTION public.check_email_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_email_available(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO authenticated;

-- 4. Lock down user_feedback_with_usernames view
ALTER VIEW public.user_feedback_with_usernames SET (security_invoker = on);
REVOKE ALL ON public.user_feedback_with_usernames FROM PUBLIC;
REVOKE ALL ON public.user_feedback_with_usernames FROM anon;
GRANT SELECT ON public.user_feedback_with_usernames TO authenticated;

-- 5. Revoke direct table access from public/anon (RLS policies control access)
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.profiles FROM anon;