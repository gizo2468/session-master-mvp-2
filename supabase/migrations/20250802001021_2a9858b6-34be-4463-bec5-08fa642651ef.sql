-- Add coaching_focus and experience fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coaching_focus TEXT[],
ADD COLUMN IF NOT EXISTS experience TEXT;