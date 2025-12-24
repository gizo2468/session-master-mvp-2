-- Update INSERT policy on shared_sessions to verify session ownership
DROP POLICY IF EXISTS "Players can insert their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Players can create their own shared sessions" ON public.shared_sessions;

CREATE POLICY "Players can create their own shared sessions" 
ON public.shared_sessions 
FOR INSERT 
WITH CHECK (
  auth.uid() = player_id AND 
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = shared_sessions.session_id 
    AND sessions.user_id = auth.uid()
  )
);

-- Enable RLS on the sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;