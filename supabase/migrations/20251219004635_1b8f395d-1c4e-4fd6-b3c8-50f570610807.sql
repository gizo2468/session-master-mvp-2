-- Enable RLS on the user_overview view
ALTER VIEW public.user_overview SET (security_invoker = on);

-- Drop the view and recreate it with proper security
DROP VIEW IF EXISTS public.user_overview;

-- Recreate as a regular view (SECURITY INVOKER is the default, which respects RLS of underlying tables)
CREATE VIEW public.user_overview 
WITH (security_invoker = true)
AS
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
WHERE 
  -- Users can only see their own data
  p.id = auth.uid()
  -- OR coaches can see their connected students
  OR EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.coach_id = auth.uid() 
      AND c.student_id = p.id 
      AND c.status = 'approved'
  )
  -- OR students can see their connected coaches
  OR EXISTS (
    SELECT 1 FROM public.coach_student_connections c
    WHERE c.student_id = auth.uid() 
      AND c.coach_id = p.id 
      AND c.status = 'approved'
  )
ORDER BY p.created_at DESC;

-- Add comment describing the view's purpose and security
COMMENT ON VIEW public.user_overview IS 'Secure user overview - users can only see their own data or data of connected coaches/students';