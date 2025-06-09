
-- Create table to associate reviews with multiple hands
CREATE TABLE public.review_hand_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.session_comments(id) ON DELETE CASCADE,
  hand_id UUID NOT NULL REFERENCES public.session_hands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, hand_id)
);

-- Add additional fields to session_comments for enhanced reviews
ALTER TABLE public.session_comments 
ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS review_category TEXT DEFAULT 'feedback';

-- Add RLS policies for the new table
ALTER TABLE public.review_hand_associations ENABLE ROW LEVEL SECURITY;

-- Policy for coaches to manage their review-hand associations
CREATE POLICY "Coaches can manage their review hand associations"
ON public.review_hand_associations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.session_comments sc
    WHERE sc.id = review_hand_associations.review_id 
    AND sc.coach_id = auth.uid()
  )
);

-- Policy for students to view review-hand associations for their reviews
CREATE POLICY "Students can view their review hand associations"
ON public.review_hand_associations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.session_comments sc
    WHERE sc.id = review_hand_associations.review_id 
    AND sc.student_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_hand_associations_review_id ON public.review_hand_associations(review_id);
CREATE INDEX IF NOT EXISTS idx_review_hand_associations_hand_id ON public.review_hand_associations(hand_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_student_coach ON public.session_comments(student_id, coach_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_review_type ON public.session_comments(review_type);
CREATE INDEX IF NOT EXISTS idx_session_comments_is_read ON public.session_comments(is_read);
