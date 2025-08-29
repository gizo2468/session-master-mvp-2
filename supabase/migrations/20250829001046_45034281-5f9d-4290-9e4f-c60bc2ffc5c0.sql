-- Fix permissions for search functions
-- Grant EXECUTE permission to authenticated users on search functions

GRANT EXECUTE ON FUNCTION public.search_coach_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_student_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.connection_exists(uuid, uuid) TO authenticated;

-- Also grant to public role for broader access
GRANT EXECUTE ON FUNCTION public.search_coach_by_username(text) TO public;
GRANT EXECUTE ON FUNCTION public.search_student_by_username(text) TO public;