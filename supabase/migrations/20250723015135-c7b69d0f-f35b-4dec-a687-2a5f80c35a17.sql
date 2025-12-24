-- Add default_currency column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN default_currency text DEFAULT 'USD';