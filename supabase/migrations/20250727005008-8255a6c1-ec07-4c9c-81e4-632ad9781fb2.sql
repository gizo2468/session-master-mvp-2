-- Create coach_student_connections table
CREATE TABLE public.coach_student_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  student_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, student_id)
);

-- Enable RLS on coach_student_connections
ALTER TABLE public.coach_student_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_student_connections
CREATE POLICY "Coaches can view their connections" 
ON public.coach_student_connections 
FOR SELECT 
USING (auth.uid() = coach_id);

CREATE POLICY "Students can view their connections" 
ON public.coach_student_connections 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Students can create connection requests" 
ON public.coach_student_connections 
FOR INSERT 
WITH CHECK (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Coaches can update connection status" 
ON public.coach_student_connections 
FOR UPDATE 
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can delete their connections" 
ON public.coach_student_connections 
FOR DELETE 
USING (auth.uid() = coach_id OR auth.uid() = student_id);

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_coach_student_connections_updated_at
BEFORE UPDATE ON public.coach_student_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policy to profiles table for connected users visibility
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_student_connections
    WHERE
      (coach_id = auth.uid() AND student_id = id)
      OR
      (student_id = auth.uid() AND coach_id = id)
  )
);

-- Add indexes for better performance on coach_student_connections
CREATE INDEX idx_coach_student_connections_coach_id ON public.coach_student_connections (coach_id);
CREATE INDEX idx_coach_student_connections_student_id ON public.coach_student_connections (student_id);