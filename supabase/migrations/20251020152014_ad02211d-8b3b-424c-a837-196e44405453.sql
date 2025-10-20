-- Revert overly-permissive public policies added previously
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication for private data access" ON public.user_private_data;

-- Explicit anon blocks already exist; authenticated, row-scoped policies remain intact.