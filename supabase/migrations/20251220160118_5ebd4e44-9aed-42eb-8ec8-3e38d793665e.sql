-- Rollback: Remove admin infrastructure added for premium toggle feature

-- Drop RLS policies on user_roles table
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Drop the has_role function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Drop the user_roles table
DROP TABLE IF EXISTS public.user_roles;

-- Drop the app_role enum type
DROP TYPE IF EXISTS public.app_role;