-- Add RLS policies to allow coaches to view tables from shared sessions
CREATE POLICY "Coaches can view tables from shared sessions" 
ON public.session_tables 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM shared_sessions 
    WHERE shared_sessions.session_id = session_tables.session_id 
    AND shared_sessions.coach_id = auth.uid()
  )
);

-- Add RLS policies to allow coaches to view hands from shared sessions
CREATE POLICY "Coaches can view hands from shared sessions" 
ON public.session_hands_new 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM shared_sessions 
    WHERE shared_sessions.session_id = session_hands_new.session_id 
    AND shared_sessions.coach_id = auth.uid()
  )
);