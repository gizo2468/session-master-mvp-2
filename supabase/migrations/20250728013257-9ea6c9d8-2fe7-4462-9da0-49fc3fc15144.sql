-- Add RLS policies for session_hands table to fix critical security issue
CREATE POLICY "Users can view hands from their sessions" 
ON public.session_hands 
FOR SELECT 
USING (
  auth.uid() = (
    SELECT sessions.user_id 
    FROM sessions 
    WHERE sessions.id = session_hands.session_id
  )
);

CREATE POLICY "Users can insert hands in their sessions" 
ON public.session_hands 
FOR INSERT 
WITH CHECK (
  auth.uid() = (
    SELECT sessions.user_id 
    FROM sessions 
    WHERE sessions.id = session_hands.session_id
  )
);

CREATE POLICY "Users can update hands in their sessions" 
ON public.session_hands 
FOR UPDATE 
USING (
  auth.uid() = (
    SELECT sessions.user_id 
    FROM sessions 
    WHERE sessions.id = session_hands.session_id
  )
);

CREATE POLICY "Users can delete hands from their sessions" 
ON public.session_hands 
FOR DELETE 
USING (
  auth.uid() = (
    SELECT sessions.user_id 
    FROM sessions 
    WHERE sessions.id = session_hands.session_id
  )
);