-- Secure user_feedback_with_usernames view by setting explicit grants
-- This prevents potential public/anon access while maintaining functionality for authenticated users

-- Step 1: Revoke all default grants from the view
REVOKE ALL ON user_feedback_with_usernames FROM PUBLIC;
REVOKE ALL ON user_feedback_with_usernames FROM anon;
REVOKE ALL ON user_feedback_with_usernames FROM authenticated;

-- Step 2: Grant SELECT only to authenticated users
-- The security_invoker = true setting (already applied) ensures that when an authenticated user
-- queries this view, the underlying RLS policies on user_feedback, profiles,
-- and user_private_data will filter the results based on their permissions
GRANT SELECT ON user_feedback_with_usernames TO authenticated;

-- Step 3: Add a comment documenting the security model
COMMENT ON VIEW user_feedback_with_usernames IS 
'Secured view with security_invoker=true. Access controlled via RLS on base tables: user_feedback (own records only), profiles (own + approved coach/student connections), user_private_data (own records only via security definer functions). Only authenticated users can query this view.';