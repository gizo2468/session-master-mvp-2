-- Create a view joining profiles and user_private_data for admin overview
CREATE OR REPLACE VIEW public.user_overview AS
SELECT 
  p.id as uid,
  upd.full_name as display_name,
  upd.email,
  p.username,
  p.role,
  p.created_at,
  p.is_active,
  p.is_premium
FROM public.profiles p
LEFT JOIN public.user_private_data upd ON p.id = upd.id
ORDER BY p.created_at DESC;

-- Add a comment describing the view
COMMENT ON VIEW public.user_overview IS 'Admin view combining profile and private data for user management';