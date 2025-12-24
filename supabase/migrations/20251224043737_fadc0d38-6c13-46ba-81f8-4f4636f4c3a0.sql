-- Grant anon access to username/email availability checks for signup validation
-- These functions only return true/false and don't expose any user data
GRANT EXECUTE ON FUNCTION public.check_username_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO anon;