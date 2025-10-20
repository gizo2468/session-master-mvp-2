-- Harden security for user_feedback_with_usernames without changing logic

-- Ensure the view runs with caller's permissions
ALTER VIEW public.user_feedback_with_usernames SET (security_invoker = on);

-- Tighten grants: no public/anon access; allow only authenticated users
REVOKE ALL ON public.user_feedback_with_usernames FROM PUBLIC;
REVOKE ALL ON public.user_feedback_with_usernames FROM anon;
REVOKE ALL ON public.user_feedback_with_usernames FROM authenticated;
GRANT SELECT ON public.user_feedback_with_usernames TO authenticated;

-- Base tables already have RLS; keep unchanged but ensure enabled (idempotent)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;