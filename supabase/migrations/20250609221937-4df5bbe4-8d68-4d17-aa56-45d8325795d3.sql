
-- Add user_id column to session_tables table
ALTER TABLE public.session_tables 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to session_hands_new table  
ALTER TABLE public.session_hands_new 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Populate user_id in session_tables from the parent sessions table
UPDATE public.session_tables 
SET user_id = (
  SELECT s.user_id 
  FROM public.sessions s 
  WHERE s.id = session_tables.session_id
);

-- Populate user_id in session_hands_new from the parent sessions table
UPDATE public.session_hands_new 
SET user_id = (
  SELECT s.user_id 
  FROM public.sessions s 
  WHERE s.id = session_hands_new.session_id
);

-- Set default value for future inserts on session_tables
ALTER TABLE public.session_tables 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Set default value for future inserts on session_hands_new
ALTER TABLE public.session_hands_new 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Make user_id NOT NULL after populating data
ALTER TABLE public.session_tables 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.session_hands_new 
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies for session_tables to use direct user_id check
DROP POLICY IF EXISTS "Users can view their session tables" ON public.session_tables;
DROP POLICY IF EXISTS "Users can insert their session tables" ON public.session_tables;
DROP POLICY IF EXISTS "Users can update their session tables" ON public.session_tables;
DROP POLICY IF EXISTS "Users can delete their session tables" ON public.session_tables;

CREATE POLICY "Users can view their session tables" ON public.session_tables
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their session tables" ON public.session_tables
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their session tables" ON public.session_tables
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their session tables" ON public.session_tables
FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for session_hands_new to use direct user_id check
DROP POLICY IF EXISTS "Users can view their session hands" ON public.session_hands_new;
DROP POLICY IF EXISTS "Users can insert their session hands" ON public.session_hands_new;
DROP POLICY IF EXISTS "Users can update their session hands" ON public.session_hands_new;
DROP POLICY IF EXISTS "Users can delete their session hands" ON public.session_hands_new;

CREATE POLICY "Users can view their session hands" ON public.session_hands_new
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their session hands" ON public.session_hands_new
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their session hands" ON public.session_hands_new
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their session hands" ON public.session_hands_new
FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on both tables if not already enabled
ALTER TABLE public.session_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_hands_new ENABLE ROW LEVEL SECURITY;
