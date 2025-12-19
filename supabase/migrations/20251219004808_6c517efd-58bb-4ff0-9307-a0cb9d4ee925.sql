-- Revoke all access from public and anon roles to prevent unauthenticated access
REVOKE ALL ON public.user_overview FROM anon;
REVOKE ALL ON public.user_overview FROM public;

-- Grant SELECT only to authenticated users (the view's WHERE clause already restricts what they see)
GRANT SELECT ON public.user_overview TO authenticated;

-- Update comment to reflect security model
COMMENT ON VIEW public.user_overview IS 'Secure user overview - only authenticated users can access, and they can only see their own data or data of connected coaches/students';