-- Fix PUBLIC_USER_DATA: Block unauthenticated access to profiles table

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke all default grants from public/anon roles
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.profiles FROM anon;

-- Grant only to authenticated role (existing policies will further restrict)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Verify no DELETE is allowed except through proper policies
REVOKE DELETE ON public.profiles FROM PUBLIC;
REVOKE DELETE ON public.profiles FROM anon;
REVOKE DELETE ON public.profiles FROM authenticated;