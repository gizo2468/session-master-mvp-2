-- Remove unique constraint to allow multiple feedback entries per hand per coach
ALTER TABLE public.hand_feedback DROP CONSTRAINT IF EXISTS unique_coach_hand_feedback;