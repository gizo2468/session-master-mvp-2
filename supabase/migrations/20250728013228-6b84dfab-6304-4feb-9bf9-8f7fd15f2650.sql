-- Create shared_sessions table with all columns and proper security
CREATE TABLE public.shared_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, coach_id)
);

-- Enable RLS on shared_sessions
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_sessions
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

CREATE POLICY "Players can view their own shared sessions" 
ON public.shared_sessions 
FOR SELECT 
USING (auth.uid() = player_id);

CREATE POLICY "Coaches can view sessions shared with them" 
ON public.shared_sessions 
FOR SELECT 
USING (auth.uid() = coach_id);

CREATE POLICY "Players can delete their own shared sessions" 
ON public.shared_sessions 
FOR DELETE 
USING (auth.uid() = player_id);

-- Create trigger for updated_at
CREATE TRIGGER update_shared_sessions_updated_at
BEFORE UPDATE ON public.shared_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on the sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

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