-- Lock down profile-adjacent functions to prevent anonymous enumeration
-- Addresses: profiles_table_public_exposure finding

-- 1. Restrict check_username_available to authenticated users only
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_username_available(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO authenticated;

-- 2. Restrict generate_connection_code to authenticated users only
REVOKE EXECUTE ON FUNCTION public.generate_connection_code() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_connection_code() FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_connection_code() TO authenticated;