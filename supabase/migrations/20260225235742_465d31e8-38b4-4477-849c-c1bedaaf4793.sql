
-- Remove the overly permissive INSERT policy that allows any authenticated user
-- to create notifications for any other user with arbitrary sender_user_id.
-- All notifications are created by database triggers which bypass RLS,
-- so no client INSERT policy is needed.
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
