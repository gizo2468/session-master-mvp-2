-- Lock down sensitive RPC functions to prevent anonymous access to user data
-- Addresses: user_private_data_view_exposure and profiles_table_public_exposure findings

-- 1. Restrict get_user_role to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;

-- 2. Restrict get_consented_student_data to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_consented_student_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_consented_student_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_consented_student_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_consented_student_data(uuid) TO service_role;

-- 3. Restrict get_consented_coach_data to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_consented_coach_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_consented_coach_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_consented_coach_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_consented_coach_data(uuid) TO service_role;

-- 4. Restrict get_coach_accessible_student_data to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_coach_accessible_student_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_coach_accessible_student_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_coach_accessible_student_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_coach_accessible_student_data(uuid) TO service_role;

-- 5. Restrict get_student_accessible_coach_data to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_student_accessible_coach_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_accessible_coach_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_student_accessible_coach_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_accessible_coach_data(uuid) TO service_role;

-- 6. Drop the user_feedback_with_usernames view
-- Addresses: user_feedback_with_usernames_public finding
-- Views cannot have RLS enabled - dropping this unused view for security
-- The underlying user_feedback table already has proper RLS policies
DROP VIEW IF EXISTS public.user_feedback_with_usernames;