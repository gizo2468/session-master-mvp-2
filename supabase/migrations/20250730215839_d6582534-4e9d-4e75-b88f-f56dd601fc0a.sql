-- Create table for hand feedback/comments
CREATE TABLE public.hand_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hand_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  student_id uuid NOT NULL,
  feedback_content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hand_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for hand feedback
CREATE POLICY "Coaches can insert feedback for their students' hands" 
ON public.hand_feedback 
FOR INSERT 
WITH CHECK (
  auth.uid() = coach_id 
  AND EXISTS (
    SELECT 1 FROM public.coach_student_connections 
    WHERE coach_id = auth.uid() 
      AND student_id = hand_feedback.student_id 
      AND status = 'approved'
  )
  AND EXISTS (
    SELECT 1 FROM public.session_hands_new 
    WHERE id = hand_feedback.hand_id 
      AND user_id = hand_feedback.student_id
  )
);

CREATE POLICY "Coaches can update their own feedback" 
ON public.hand_feedback 
FOR UPDATE 
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can view feedback they created" 
ON public.hand_feedback 
FOR SELECT 
USING (auth.uid() = coach_id);

CREATE POLICY "Students can view feedback on their hands" 
ON public.hand_feedback 
FOR SELECT 
USING (
  auth.uid() = student_id 
  AND EXISTS (
    SELECT 1 FROM public.session_hands_new 
    WHERE id = hand_feedback.hand_id 
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can delete their own feedback" 
ON public.hand_feedback 
FOR DELETE 
USING (auth.uid() = coach_id);

-- Create function to update timestamps
CREATE TRIGGER update_hand_feedback_updated_at
BEFORE UPDATE ON public.hand_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to prevent duplicate feedback from same coach on same hand
ALTER TABLE public.hand_feedback 
ADD CONSTRAINT unique_coach_hand_feedback 
UNIQUE (hand_id, coach_id);