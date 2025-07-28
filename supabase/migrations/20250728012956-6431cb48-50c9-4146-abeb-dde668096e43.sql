-- Add updated_at column to shared_sessions table
ALTER TABLE public.shared_sessions 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add RLS policy to sessions table so coaches can view shared sessions
CREATE POLICY "Coaches can view shared sessions" 
ON public.sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_sessions
    WHERE 
      shared_sessions.session_id = sessions.id
      AND shared_sessions.coach_id = auth.uid()
  )
);